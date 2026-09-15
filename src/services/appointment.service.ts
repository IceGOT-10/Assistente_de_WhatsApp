import { PrismaClient, StatusAppointment, StatusLead, TipoAtendimento, TurnoPreferencia } from "@prisma/client";

const prisma = new PrismaClient();

export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentConflictError";
  }
}

export class AppointmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentValidationError";
  }
}

export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    throw new AppointmentValidationError(`Horário inválido: '${timeStr}'. Use o formato HH:mm.`);
  }
  return parts[0] * 60 + parts[1];
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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
   * Valida regras de negócio essenciais para qualquer agendamento:
   * 1. Bloqueio aos domingos
   * 2. Duração mínima de 15 minutos e horarioInicio < horarioFim
   * 3. Horário dentro do expediente clínico (08:00 às 18:00)
   * 4. Bloqueio de sobreposição com o intervalo de almoço padrão (12:00 às 13:00)
   */
  public static validateScheduleRules(
    dataStr: string,
    horarioInicio: string,
    horarioFim: string
  ): {
    dateObj: Date;
    startMinutes: number;
    endMinutes: number;
  } {
    const dateObj = this.parseDateStringToUTC(dataStr);

    // 1. Bloqueia agendamentos aos domingos
    if (dateObj.getUTCDay() === 0) {
      throw new AppointmentValidationError(
        "A clínica não realiza atendimentos aos domingos."
      );
    }

    const startMinutes = parseTimeToMinutes(horarioInicio);
    const endMinutes = parseTimeToMinutes(horarioFim);

    // 2. Rejeita horarioInicio >= horarioFim
    if (startMinutes >= endMinutes) {
      throw new AppointmentValidationError(
        `O horário de término (${horarioFim}) deve ser posterior ao horário de início (${horarioInicio}).`
      );
    }

    // 3. Duração mínima de 15 minutos
    if (endMinutes - startMinutes < 15) {
      throw new AppointmentValidationError(
        "A duração da consulta deve ser de no mínimo 15 minutos."
      );
    }

    // 4. Bloqueia fora do expediente clínico (permitido apenas 08:00 às 18:00)
    const CLINIC_OPEN = 8 * 60; // 480 min (08:00)
    const CLINIC_CLOSE = 18 * 60; // 1080 min (18:00)
    if (startMinutes < CLINIC_OPEN || endMinutes > CLINIC_CLOSE) {
      throw new AppointmentValidationError(
        "Horário fora do expediente da clínica. Os atendimentos são permitidos exclusivamente entre 08:00 e 18:00."
      );
    }

    // 5. Bloqueia sobreposição no horário de almoço padrão da equipe (12:00 às 13:00)
    const LUNCH_START = 12 * 60; // 720 min (12:00)
    const LUNCH_END = 13 * 60; // 780 min (13:00)
    if (startMinutes < LUNCH_END && endMinutes > LUNCH_START) {
      throw new AppointmentValidationError(
        "O agendamento não pode sobrepor o intervalo de almoço da equipe da clínica (12:00 às 13:00)."
      );
    }

    return { dateObj, startMinutes, endMinutes };
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
   * Valida expediente, almoço, conflito de horários (double-booking com sobreposição de intervalos)
   * e cria ou atualiza o Lead vinculado com status AGENDADO.
   */
  public static async createAppointment(dto: CreateAppointmentDTO) {
    const cleanTelefone = dto.telefone.replace(/\D/g, "");

    // 1. Calcula horarioFim padrão caso não fornecido
    let horarioFim = dto.horarioFim;
    if (!horarioFim && dto.horarioInicio) {
      let duracao = 45;
      if (dto.serviceId) {
        const s = await prisma.service.findUnique({ where: { id: dto.serviceId } });
        if (s?.duracaoMinutos) duracao = s.duracaoMinutos;
      } else if (dto.procedimento) {
        const s = await prisma.service.findFirst({
          where: { nome: { contains: dto.procedimento, mode: "insensitive" } },
        });
        if (s?.duracaoMinutos) duracao = s.duracaoMinutos;
      }
      const startMin = parseTimeToMinutes(dto.horarioInicio);
      horarioFim = minutesToTimeString(startMin + duracao);
    }

    if (!horarioFim) {
      throw new AppointmentValidationError("Horário de término da consulta é obrigatório.");
    }

    // 2. Validações de expediente, domingo, duração e horário de almoço
    const { dateObj, startMinutes, endMinutes } = this.validateScheduleRules(
      dto.data,
      dto.horarioInicio,
      horarioFim
    );

    return await prisma.$transaction(async (tx) => {
      // 3. Resolve professionalId e nome padronizado
      let professionalId = dto.professionalId || null;
      let profissionalNome = dto.profissional;

      if (!professionalId && dto.profissional) {
        const foundProf = await tx.professional.findFirst({
          where: { nome: { contains: dto.profissional, mode: "insensitive" } },
        });
        if (foundProf) {
          professionalId = foundProf.id;
          profissionalNome = foundProf.nome;
        }
      } else if (professionalId && !profissionalNome) {
        const foundProf = await tx.professional.findUnique({ where: { id: professionalId } });
        if (foundProf) {
          profissionalNome = foundProf.nome;
        }
      }

      let serviceId = dto.serviceId || null;
      if (!serviceId && dto.procedimento) {
        const foundSrv = await tx.service.findFirst({
          where: { nome: { contains: dto.procedimento, mode: "insensitive" } },
        });
        if (foundSrv) serviceId = foundSrv.id;
      }

      // 4. BLINDAGEM CONTRA DOUBLE-BOOKING:
      // Verifica agendamentos ativos existentes (AGENDADO ou CONFIRMADO) para o mesmo profissional na data
      const existingAppointments = await tx.appointment.findMany({
        where: {
          data: dateObj,
          status: { in: [StatusAppointment.AGENDADO, StatusAppointment.CONFIRMADO] },
          OR: [
            ...(professionalId ? [{ professionalId }] : []),
            ...(profissionalNome ? [{ profissional: { equals: profissionalNome, mode: "insensitive" as const } }] : []),
          ],
        },
        select: {
          id: true,
          horarioInicio: true,
          horarioFim: true,
          profissional: true,
        },
      });

      // Aplica a regra matemática de sobreposição de intervalos:
      // (novoInicio < existenteFim) E (novoFim > existenteInicio)
      const conflict = existingAppointments.find((apt) => {
        const aptStart = parseTimeToMinutes(apt.horarioInicio);
        const aptEnd = parseTimeToMinutes(apt.horarioFim);
        return startMinutes < aptEnd && endMinutes > aptStart;
      });

      if (conflict) {
        throw new AppointmentConflictError(
          `Conflito de agendamento: O profissional ${profissionalNome || dto.profissional} já possui consulta agendada entre ${conflict.horarioInicio} e ${conflict.horarioFim} nesta data.`
        );
      }

      // 5. Busca ou cria o Lead atomicamente
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

      // 6. Cria o Appointment
      const appointment = await tx.appointment.create({
        data: {
          leadId: lead.id,
          data: dateObj,
          horarioInicio: dto.horarioInicio,
          horarioFim,
          profissional: profissionalNome || dto.profissional,
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

      // 7. Registra ação de auditoria na AiActionLog
      await tx.aiActionLog.create({
        data: {
          tipo: "AGENDAMENTO",
          telefone: cleanTelefone,
          detalhes: `Consulta criada para ${dto.data} das ${dto.horarioInicio} às ${horarioFim} com ${profissionalNome || dto.profissional}`,
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
   * Aplica validações de expediente, almoço e blindagem contra double-booking.
   */
  public static async updateAppointment(id: string, dto: UpdateAppointmentDTO) {
    const current = await prisma.appointment.findUnique({
      where: { id },
      include: { professional: true },
    });

    if (!current) {
      throw new AppointmentValidationError("Agendamento não localizado para atualização.");
    }

    const targetDateStr = dto.data || current.data.toISOString().split("T")[0];
    const targetHorarioInicio = dto.horarioInicio || current.horarioInicio;
    const targetHorarioFim = dto.horarioFim || current.horarioFim;

    // Validações de expediente, almoço, domingo e horário de término
    const { dateObj, startMinutes, endMinutes } = this.validateScheduleRules(
      targetDateStr,
      targetHorarioInicio,
      targetHorarioFim
    );

    return await prisma.$transaction(async (tx) => {
      let professionalId = dto.professionalId !== undefined ? dto.professionalId : current.professionalId;
      let profissionalNome = dto.profissional !== undefined ? dto.profissional : current.profissional;

      if (dto.profissional && dto.professionalId === undefined) {
        const foundProf = await tx.professional.findFirst({
          where: { nome: { contains: dto.profissional, mode: "insensitive" } },
        });
        if (foundProf) {
          professionalId = foundProf.id;
          profissionalNome = foundProf.nome;
        }
      }

      // Validação de double-booking contra outros agendamentos ativos (excluindo a si próprio)
      const existingAppointments = await tx.appointment.findMany({
        where: {
          id: { not: id },
          data: dateObj,
          status: { in: [StatusAppointment.AGENDADO, StatusAppointment.CONFIRMADO] },
          OR: [
            ...(professionalId ? [{ professionalId }] : []),
            ...(profissionalNome ? [{ profissional: { equals: profissionalNome, mode: "insensitive" as const } }] : []),
          ],
        },
        select: {
          id: true,
          horarioInicio: true,
          horarioFim: true,
          profissional: true,
        },
      });

      const conflict = existingAppointments.find((apt) => {
        const aptStart = parseTimeToMinutes(apt.horarioInicio);
        const aptEnd = parseTimeToMinutes(apt.horarioFim);
        return startMinutes < aptEnd && endMinutes > aptStart;
      });

      if (conflict) {
        throw new AppointmentConflictError(
          `Conflito de agendamento: O profissional ${profissionalNome} já possui consulta marcada entre ${conflict.horarioInicio} e ${conflict.horarioFim} nesta data.`
        );
      }

      const dataToUpdate: any = {
        data: dateObj,
        horarioInicio: targetHorarioInicio,
        horarioFim: targetHorarioFim,
        profissional: profissionalNome,
        professionalId,
      };

      if (dto.servico) dataToUpdate.servico = dto.servico;
      if (dto.serviceId !== undefined) dataToUpdate.serviceId = dto.serviceId;
      if (dto.observacoes !== undefined) dataToUpdate.observacoes = dto.observacoes;

      const appointment = await tx.appointment.update({
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
    });
  }

  /**
   * Horários padrão de atendimento da clínica
   */
  public static readonly CLINIC_HOURS = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  /**
   * Consulta horários disponíveis no banco para uma data específica (YYYY-MM-DD),
   * levando em conta a duração real do serviço e considerando vago se pelo menos
   * um profissional ativo estiver livre no intervalo pretendido.
   */
  public static async consultarHorariosDisponiveis(params: {
    data: string;
    profissional?: string;
    professionalId?: string;
    servico?: string;
    serviceId?: string;
  }): Promise<{
    data: string;
    horarios: string[];
    profissional?: string;
    duracaoMinutos: number;
    mensagem: string;
  }> {
    const dataNormalized = this.parseDateStringToUTC(params.data);

    // 1. Bloqueio aos domingos
    if (dataNormalized.getUTCDay() === 0) {
      return {
        data: params.data,
        horarios: [],
        profissional: params.profissional,
        duracaoMinutos: 45,
        mensagem: "A clínica não realiza atendimentos aos domingos. Por favor, escolha uma data entre segunda e sexta-feira.",
      };
    }

    // 2. Calcula a duração real do serviço pretendido
    let duracaoMinutos = 45;
    if (params.serviceId) {
      const srv = await prisma.service.findUnique({ where: { id: params.serviceId } });
      if (srv?.duracaoMinutos) duracaoMinutos = srv.duracaoMinutos;
    } else if (params.servico) {
      const srv = await prisma.service.findFirst({
        where: { nome: { contains: params.servico, mode: "insensitive" } },
      });
      if (srv?.duracaoMinutos) duracaoMinutos = srv.duracaoMinutos;
    }

    // 3. Obtém profissionais ativos a avaliar
    let activeProfessionals: Array<{ id: string; nome: string }> = [];
    if (params.professionalId) {
      const p = await prisma.professional.findUnique({ where: { id: params.professionalId } });
      if (p) activeProfessionals = [p];
    } else if (params.profissional) {
      const list = await prisma.professional.findMany({
        where: {
          nome: { contains: params.profissional, mode: "insensitive" },
          ativo: true,
        },
      });
      if (list.length > 0) {
        activeProfessionals = list;
      } else {
        activeProfessionals = [{ id: "", nome: params.profissional }];
      }
    } else {
      activeProfessionals = await prisma.professional.findMany({
        where: { ativo: true },
      });
      if (activeProfessionals.length === 0) {
        activeProfessionals = [
          { id: "camila", nome: "Dra. Camila Duarte" },
          { id: "lucas", nome: "Dr. Lucas Ramos" },
        ];
      }
    }

    // 4. Busca todos os agendamentos ativos na data especificada
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        data: dataNormalized,
        status: { in: [StatusAppointment.AGENDADO, StatusAppointment.CONFIRMADO] },
      },
      select: {
        id: true,
        horarioInicio: true,
        horarioFim: true,
        professionalId: true,
        profissional: true,
      },
    });

    const LUNCH_START = 12 * 60; // 720 min (12:00)
    const LUNCH_END = 13 * 60;   // 780 min (13:00)
    const CLINIC_CLOSE = 18 * 60; // 1080 min (18:00)

    const horariosLivres: string[] = [];

    // 5. Avalia cada slot candidato em relação à duração do serviço e expediente
    for (const slot of this.CLINIC_HOURS) {
      const slotStart = parseTimeToMinutes(slot);
      const slotEnd = slotStart + duracaoMinutos;

      // Não pode ultrapassar o fechamento da clínica (18:00)
      if (slotEnd > CLINIC_CLOSE) continue;

      // Não pode sobrepor o intervalo de almoço (12:00 às 13:00)
      if (slotStart < LUNCH_END && slotEnd > LUNCH_START) continue;

      // Se o paciente não selecionar um profissional específico, considera o horário vago
      // se pelo menos UM profissional ativo estiver livre naquele intervalo.
      const temProfissionalDisponivel = activeProfessionals.some((prof) => {
        const temConflito = activeAppointments.some((apt) => {
          const aptMatchesProf =
            (prof.id && apt.professionalId === prof.id) ||
            (apt.profissional && prof.nome && apt.profissional.toLowerCase().includes(prof.nome.toLowerCase())) ||
            (prof.nome && apt.profissional && prof.nome.toLowerCase().includes(apt.profissional.toLowerCase()));

          if (!aptMatchesProf) return false;

          const aptStart = parseTimeToMinutes(apt.horarioInicio);
          const aptEnd = parseTimeToMinutes(apt.horarioFim);

          // Sobreposição: (slotStart < aptEnd) E (slotEnd > aptStart)
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        return !temConflito;
      });

      if (temProfissionalDisponivel) {
        horariosLivres.push(slot);
      }
    }

    const profissionalNome = params.profissional || (activeProfessionals.length === 1 ? activeProfessionals[0].nome : "nossa equipe");
    const mensagem =
      horariosLivres.length > 0
        ? `Temos os seguintes horários disponíveis para ${params.data} com ${profissionalNome} (${duracaoMinutos} min): ${horariosLivres.join(", ")}.`
        : `Infelizmente não temos horários disponíveis para ${params.data} com ${profissionalNome} para procedimento de ${duracaoMinutos} min. Gostaria de verificar outra data?`;

    return {
      data: params.data,
      horarios: horariosLivres,
      profissional: params.profissional,
      duracaoMinutos,
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

