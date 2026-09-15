import { PrismaClient, StatusAppointment, StatusLead, TipoAtendimento, TurnoPreferencia } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateAppointmentDTO {
  nomeCompleto: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento?: "PARTICULAR" | "CONVENIO";
  nomeConvenio?: string | null;
  data: string; // "YYYY-MM-DD"
  horarioInicio: string; // "09:00"
  horarioFim: string; // "10:00"
  profissional: string;
  observacoes?: string | null;
}

export interface UpdateAppointmentDTO {
  data?: string; // "YYYY-MM-DD"
  horarioInicio?: string;
  horarioFim?: string;
  profissional?: string;
  servico?: string;
  observacoes?: string | null;
}

export class AppointmentService {
  /**
   * Converte uma string "YYYY-MM-DD" para um objeto Date seguro (meio-dia UTC)
   * garantindo que a data seja gravada sem desvios de fuso horário UTC-3 no PostgreSQL (@db.Date).
   */
  public static parseDateStringToUTC(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  }

  /**
   * Lista agendamentos com filtros por período ('startDate', 'endDate'), profissional e status.
   */
  public static async listAppointments(filters: {
    startDate?: string;
    endDate?: string;
    profissional?: string;
    status?: StatusAppointment;
  }) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.data = {};
      if (filters.startDate) {
        where.data.gte = this.parseDateStringToUTC(filters.startDate);
      }
      if (filters.endDate) {
        where.data.lte = this.parseDateStringToUTC(filters.endDate);
      }
    }

    if (filters.profissional && filters.profissional !== "ALL") {
      where.profissional = filters.profissional;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        lead: true,
      },
      orderBy: [
        { data: "asc" },
        { horarioInicio: "asc" },
      ],
    });

    return appointments.map((apt) => ({
      id: apt.id,
      leadId: apt.leadId,
      data: apt.data.toISOString().split("T")[0],
      horarioInicio: apt.horarioInicio,
      horarioFim: apt.horarioFim,
      profissional: apt.profissional,
      servico: apt.servico,
      status: apt.status,
      observacoes: apt.observacoes,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
      lead: {
        id: apt.lead.id,
        nomeCompleto: apt.lead.nomeCompleto,
        telefone: apt.lead.telefone,
        procedimento: apt.lead.procedimento,
        tipoAtendimento: apt.lead.tipoAtendimento,
        nomeConvenio: apt.lead.nomeConvenio,
        status: apt.lead.status,
      },
    }));
  }

  /**
   * Cria um novo agendamento, garantindo a integridade do Lead (cria ou vincula o Lead antes de persistir o Appointment).
   */
  public static async createAppointment(dto: CreateAppointmentDTO) {
    const cleanTelefone = dto.telefone.replace(/\D/g, "");

    // 1. Busca ou cria o Lead para evitar Foreign Key constraint violation (P2003)
    let lead = await prisma.lead.findUnique({
      where: { telefone: cleanTelefone },
    });

    if (!lead) {
      const tipo = dto.tipoAtendimento === "CONVENIO" ? TipoAtendimento.CONVENIO : TipoAtendimento.PARTICULAR;
      lead = await prisma.lead.create({
        data: {
          nomeCompleto: dto.nomeCompleto,
          telefone: cleanTelefone,
          procedimento: dto.procedimento,
          tipoAtendimento: tipo,
          nomeConvenio: dto.nomeConvenio || null,
          periodoPreferencia: TurnoPreferencia.QUALQUER,
          status: StatusLead.AGENDADO,
        },
      });
    } else {
      // Atualiza o status do lead existente para AGENDADO
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: StatusLead.AGENDADO,
          procedimento: dto.procedimento || lead.procedimento,
        },
      });
    }

    const dateObj = this.parseDateStringToUTC(dto.data);

    const appointment = await prisma.appointment.create({
      data: {
        leadId: lead.id,
        data: dateObj,
        horarioInicio: dto.horarioInicio,
        horarioFim: dto.horarioFim,
        profissional: dto.profissional,
        servico: dto.procedimento,
        status: StatusAppointment.AGENDADO,
        observacoes: dto.observacoes || null,
      },
      include: {
        lead: true,
      },
    });

    return {
      ...appointment,
      data: appointment.data.toISOString().split("T")[0],
    };
  }

  /**
   * Atualiza o status de um agendamento e sincroniza o status do Lead caso necessário.
   */
  public static async updateStatus(id: string, status: StatusAppointment) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { lead: true },
    });

    if (status === StatusAppointment.CANCELADO) {
      await prisma.lead.update({
        where: { id: appointment.leadId },
        data: { status: StatusLead.TRANSBORDO_HUMANO },
      });
    } else if (status === StatusAppointment.CONFIRMADO || status === StatusAppointment.AGENDADO) {
      await prisma.lead.update({
        where: { id: appointment.leadId },
        data: { status: StatusLead.AGENDADO },
      });
    }

    return {
      ...appointment,
      data: appointment.data.toISOString().split("T")[0],
    };
  }

  /**
   * Edita data, horário, serviço, profissional ou observações de um agendamento.
   */
  public static async updateAppointment(id: string, dto: UpdateAppointmentDTO) {
    const dataToUpdate: any = {};

    if (dto.data) {
      dataToUpdate.data = this.parseDateStringToUTC(dto.data);
    }
    if (dto.horarioInicio) dataToUpdate.horarioInicio = dto.horarioInicio;
    if (dto.horarioFim) dataToUpdate.horarioFim = dto.horarioFim;
    if (dto.profissional) dataToUpdate.profissional = dto.profissional;
    if (dto.servico) dataToUpdate.servico = dto.servico;
    if (dto.observacoes !== undefined) dataToUpdate.observacoes = dto.observacoes;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: dataToUpdate,
      include: { lead: true },
    });

    return {
      ...appointment,
      data: appointment.data.toISOString().split("T")[0],
    };
  }
}

