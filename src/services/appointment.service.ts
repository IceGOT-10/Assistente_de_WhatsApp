import { PrismaClient, StatusAppointment, StatusLead, TipoAtendimento, TurnoPreferencia } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateAppointmentDTO {
  leadId?: string;
  nomeCompleto: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento?: "PARTICULAR" | "CONVENIO";
  nomeConvenio?: string | null;
  data: string; // "YYYY-MM-DD"
  horarioInicio: string; // "09:00"
  horarioFim?: string; // "10:00"
  profissional: string;
  professionalId?: string | null;
  serviceId?: string | null;
  observacoes?: string | null;
}

export interface UpdateAppointmentDTO {
  data?: string; // "YYYY-MM-DD"
  horarioInicio?: string;
  horarioFim?: string;
  profissional?: string;
  professionalId?: string | null;
  servico?: string;
  serviceId?: string | null;
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
        professional: true,
        service: true,
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
      professionalId: apt.professionalId,
      servico: apt.servico,
      serviceId: apt.serviceId,
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
   * Cria um novo agendamento de forma atômica com prisma.$transaction.
   * Cria ou atualiza o Lead, vincula a consulta e atualiza o status do Lead para AGENDADO.
   */
  public static async createAppointment(dto: CreateAppointmentDTO) {
    const cleanTelefone = dto.telefone.replace(/\D/g, "");

    return await prisma.$transaction(async (tx) => {
      // 1. Busca ou cria o Lead atomicamente
      let lead = null;
      if (dto.leadId) {
        lead = await tx.lead.findUnique({ where: { id: dto.leadId } });
      }
      if (!lead && cleanTelefone) {
        lead = await tx.lead.findUnique({ where: { telefone: cleanTelefone } });
      }

      const tipo = dto.tipoAtendimento === "CONVENIO" ? TipoAtendimento.CONVENIO : TipoAtendimento.PARTICULAR;

      if (!lead) {
        lead = await tx.lead.create({
          data: {
            nomeCompleto: dto.nomeCompleto,
            telefone: cleanTelefone,
            procedimento: dto.procedimento,
            tipoAtendimento: tipo,
            nomeConvenio: dto.nomeConvenio || null,
            periodoPreferencia: TurnoPreferencia.QUALQUER,
            status: StatusLead.AGENDADO,
            observacoes: dto.observacoes || null,
          },
        });
      } else {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            status: StatusLead.AGENDADO,
            nomeCompleto: dto.nomeCompleto || lead.nomeCompleto,
            procedimento: dto.procedimento || lead.procedimento,
            observacoes: dto.observacoes !== undefined ? dto.observacoes : lead.observacoes,
            ...(dto.nomeConvenio ? { nomeConvenio: dto.nomeConvenio } : {}),
            ...(dto.tipoAtendimento ? { tipoAtendimento: tipo } : {}),
          },
        });
      }

      // 2. Resolve professionalId e serviceId para manter integridade
      let professionalId = dto.professionalId || null;
      if (!professionalId && dto.profissional) {
        const foundProf = await tx.professional.findFirst({
          where: { nome: { contains: dto.profissional, mode: "insensitive" } },
        });
        if (foundProf) professionalId = foundProf.id;
      }

      let serviceId = dto.serviceId || null;
      if (!serviceId && dto.procedimento) {
        const foundSrv = await tx.service.findFirst({
          where: { nome: { contains: dto.procedimento, mode: "insensitive" } },
        });
        if (foundSrv) serviceId = foundSrv.id;
      }

      // 3. Calcula horarioFim padrão caso não fornecido (45 minutos de duração)
      let horarioFim = dto.horarioFim;
      if (!horarioFim && dto.horarioInicio) {
        const [h, m] = dto.horarioInicio.split(":").map(Number);
        const endMinutes = h * 60 + m + 45;
        const endH = Math.floor(endMinutes / 60) % 24;
        const endM = endMinutes % 60;
        horarioFim = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      }

      const dateObj = this.parseDateStringToUTC(dto.data);

      // 4. Cria o Appointment
      const appointment = await tx.appointment.create({
        data: {
          leadId: lead.id,
          data: dateObj,
          horarioInicio: dto.horarioInicio,
          horarioFim: horarioFim || "10:00",
          profissional: dto.profissional,
          professionalId,
          servico: dto.procedimento,
          serviceId,
          status: StatusAppointment.AGENDADO,
          observacoes: dto.observacoes || null,
        },
        include: {
          lead: true,
          professional: true,
          service: true,
        },
      });

      // 5. Registra ação de auditoria na AiActionLog
      await tx.aiActionLog.create({
        data: {
          tipo: "AGENDAMENTO",
          telefone: cleanTelefone,
          detalhes: `Consulta criada para ${dto.data} às ${dto.horarioInicio} com ${dto.profissional}`,
        },
      });

      return {
        ...appointment,
        data: appointment.data.toISOString().split("T")[0],
      };
    });
  }

  /**
   * Atualiza o status de um agendamento e sincroniza o status do Lead de forma transacional.
   */
  public static async updateStatus(id: string, status: StatusAppointment) {
    return await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id },
        data: { status },
        include: { lead: true },
      });

      if (status === StatusAppointment.CANCELADO) {
        await tx.lead.update({
          where: { id: appointment.leadId },
          data: { status: StatusLead.TRANSBORDO_HUMANO },
        });
      } else if (status === StatusAppointment.CONFIRMADO || status === StatusAppointment.AGENDADO) {
        await tx.lead.update({
          where: { id: appointment.leadId },
          data: { status: StatusLead.AGENDADO },
        });
      }

      return {
        ...appointment,
        data: appointment.data.toISOString().split("T")[0],
      };
    });
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
    if (dto.professionalId !== undefined) dataToUpdate.professionalId = dto.professionalId;
    if (dto.servico) dataToUpdate.servico = dto.servico;
    if (dto.serviceId !== undefined) dataToUpdate.serviceId = dto.serviceId;
    if (dto.observacoes !== undefined) dataToUpdate.observacoes = dto.observacoes;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        lead: true,
        professional: true,
        service: true,
      },
    });

    return {
      ...appointment,
      data: appointment.data.toISOString().split("T")[0],
    };
  }

  /**
   * Horários padrão de atendimento da clínica
   */
  public static readonly CLINIC_HOURS = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  /**
   * Consulta horários disponíveis no banco para uma data específica (YYYY-MM-DD),
   * normalizada para meio-dia UTC para coincidir exatamente com as datas persistidas.
   */
  public static async consultarHorariosDisponiveis(params: {
    data: string;
    profissional?: string;
    professionalId?: string;
    servico?: string;
  }): Promise<{
    data: string;
    horarios: string[];
    profissional?: string;
    mensagem: string;
  }> {
    const dataNormalized = this.parseDateStringToUTC(params.data);

    const where: any = {
      data: dataNormalized,
      status: { not: StatusAppointment.CANCELADO },
    };

    if (params.professionalId) {
      where.professionalId = params.professionalId;
    } else if (params.profissional) {
      where.profissional = { contains: params.profissional, mode: "insensitive" };
    }

    const ocupados = await prisma.appointment.findMany({
      where,
      select: { horarioInicio: true },
    });

    const horariosOcupados = new Set(ocupados.map((a) => a.horarioInicio));
    const horariosLivres = this.CLINIC_HOURS.filter((h) => !horariosOcupados.has(h));

    const profissionalNome = params.profissional || "nossa equipe";
    const mensagem =
      horariosLivres.length > 0
        ? `Temos os seguintes horários disponíveis para ${params.data} com ${profissionalNome}: ${horariosLivres.join(", ")}.`
        : `Infelizmente não temos horários disponíveis para ${params.data} com ${profissionalNome}. Gostaria de verificar outra data?`;

    return {
      data: params.data,
      horarios: horariosLivres,
      profissional: params.profissional,
      mensagem,
    };
  }

  /**
   * Cancela uma consulta ativa do paciente (pelo telefone ou leadId).
   * Altera status para CANCELADO e gera registro em AiActionLog.
   */
  public static async cancelarConsulta(params: {
    telefone?: string;
    leadId?: string;
    motivo?: string;
  }): Promise<{
    success: boolean;
    appointment?: any;
    message: string;
  }> {
    const cleanTelefone = params.telefone ? params.telefone.replace(/\D/g, "") : undefined;

    // Localiza consulta ativa mais recente (AGENDADO ou CONFIRMADO)
    const appointment = await prisma.appointment.findFirst({
      where: {
        status: { in: [StatusAppointment.AGENDADO, StatusAppointment.CONFIRMADO] },
        OR: [
          ...(params.leadId ? [{ leadId: params.leadId }] : []),
          ...(cleanTelefone ? [{ lead: { telefone: cleanTelefone } }] : []),
        ],
      },
      orderBy: { data: "desc" },
      include: { lead: true },
    });

    if (!appointment) {
      return {
        success: false,
        message: "Não localizei nenhum agendamento ativo para este contato para ser cancelado.",
      };
    }

    const motivo = params.motivo || "Solicitado pelo paciente via WhatsApp";

    // Transação: atualiza appointment, lead e registra log
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: StatusAppointment.CANCELADO,
          observacoes: appointment.observacoes
            ? `${appointment.observacoes}\n[Cancelamento IA: ${motivo}]`
            : `[Cancelamento IA: ${motivo}]`,
        },
      });

      await tx.lead.update({
        where: { id: appointment.leadId },
        data: {
          status: StatusLead.TRANSBORDO_HUMANO,
          observacoes: appointment.lead.observacoes
            ? `${appointment.lead.observacoes}\n[Consulta cancelada pela IA: ${motivo}]`
            : `[Consulta cancelada pela IA: ${motivo}]`,
        },
      });

      await tx.aiActionLog.create({
        data: {
          tipo: "CANCELAMENTO_CONSULTA",
          telefone: appointment.lead.telefone,
          detalhes: `Consulta do dia ${appointment.data.toISOString().split("T")[0]} às ${appointment.horarioInicio} cancelada. Motivo: ${motivo}`,
        },
      });
    });

    const dataFormatada = appointment.data.toISOString().split("T")[0];
    return {
      success: true,
      appointment: {
        id: appointment.id,
        data: dataFormatada,
        horarioInicio: appointment.horarioInicio,
        profissional: appointment.profissional,
        servico: appointment.servico,
      },
      message: `Consulta do dia ${dataFormatada} às ${appointment.horarioInicio} com ${appointment.profissional} foi cancelada com sucesso.`,
    };
  }
}

