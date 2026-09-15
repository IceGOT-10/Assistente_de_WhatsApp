import { PrismaClient, StatusAppointment } from "@prisma/client";
import { AiConfigService } from "./aiConfig.service";

const prisma = new PrismaClient();

export interface DashboardStatsResponse {
  agendamentosHoje: number;
  confirmados: number;
  aguardando: number;
  cancelados: number;
  variacaoOntemPercentual: number;
  iaAtiva: boolean;
  iaAcoes: {
    atendimentos: number;
    agendamentos: number;
    confirmacoes: number;
    reagendamentos: number;
    encaminhamentos: number;
  };
}

export interface UpcomingAppointmentItem {
  id: string;
  horario: string;
  horarioInicio: string;
  horarioFim: string;
  data: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
    tipoAtendimento: string;
    convenio?: string | null;
  };
  servico: string;
  profissional: string;
  status: "CONFIRMADO" | "AGUARDANDO" | "CANCELADO" | "CONCLUIDO";
}

export class DashboardService {
  /**
   * Obtém as métricas consolidadas diárias do dashboard e contadores de ações da IA sem dados fictícios.
   */
  public static async getStats(): Promise<DashboardStatsResponse> {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    const ontemInicio = new Date(hojeInicio);
    ontemInicio.setDate(ontemInicio.getDate() - 1);

    const ontemFim = new Date(hojeFim);
    ontemFim.setDate(ontemFim.getDate() - 1);

    // 1. Agendamentos de hoje
    const appointmentsHoje = await prisma.appointment.findMany({
      where: {
        data: {
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    // 2. Agendamentos de ontem para cálculo comparativo
    const appointmentsOntemCount = await prisma.appointment.count({
      where: {
        data: {
          gte: ontemInicio,
          lte: ontemFim,
        },
      },
    });

    const agendamentosHoje = appointmentsHoje.length;
    const confirmados = appointmentsHoje.filter(
      (a) => a.status === StatusAppointment.CONFIRMADO
    ).length;
    const aguardando = appointmentsHoje.filter(
      (a) => a.status === StatusAppointment.AGENDADO
    ).length;
    const cancelados = appointmentsHoje.filter(
      (a) => a.status === StatusAppointment.CANCELADO
    ).length;

    // Cálculo estrito de variação percentual
    let variacaoOntemPercentual = 0;
    if (appointmentsOntemCount > 0) {
      variacaoOntemPercentual = Math.round(
        ((agendamentosHoje - appointmentsOntemCount) / appointmentsOntemCount) * 100
      );
    } else if (agendamentosHoje > 0) {
      variacaoOntemPercentual = 100;
    } else {
      variacaoOntemPercentual = 0;
    }

    if (isNaN(variacaoOntemPercentual) || !isFinite(variacaoOntemPercentual)) {
      variacaoOntemPercentual = 0;
    }

    // 3. Ações reais da IA no dia
    const logsHoje = await prisma.aiActionLog.findMany({
      where: {
        createdAt: {
          gte: hojeInicio,
          lte: hojeFim,
        },
      },
    });

    const aiConfig = await AiConfigService.getConfig();

    const atendimentosIa = logsHoje.filter((l) => l.tipo === "ATENDIMENTO" || l.tipo === "TRIAGEM").length;
    const agendamentosIa = logsHoje.filter((l) => l.tipo === "AGENDAMENTO").length;
    const confirmacoesIa = logsHoje.filter((l) => l.tipo === "CONFIRMACAO").length;
    const reagendamentosIa = logsHoje.filter((l) => l.tipo === "REAGENDAMENTO").length;
    const encaminhamentosIa = logsHoje.filter((l) => l.tipo === "TRANSBORDO").length;

    // Métricas puras baseadas estritamente no banco de dados (zero se não houver)
    const iaAcoes = {
      atendimentos: atendimentosIa,
      agendamentos: agendamentosIa,
      confirmacoes: confirmacoesIa,
      reagendamentos: reagendamentosIa,
      encaminhamentos: encaminhamentosIa,
    };

    return {
      agendamentosHoje,
      confirmados,
      aguardando,
      cancelados,
      variacaoOntemPercentual,
      iaAtiva: aiConfig?.iaAtiva ?? true,
      iaAcoes,
    };
  }

  /**
   * Obtém os próximos 5 atendimentos do dia com detalhes do lead associado.
   */
  public static async getUpcomingAppointments(): Promise<UpcomingAppointmentItem[]> {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      take: 5,
      where: {
        data: {
          gte: hojeInicio,
        },
      },
      include: {
        lead: true,
      },
      orderBy: [
        { data: "asc" },
        { horarioInicio: "asc" },
      ],
    });

    return appointments.map((apt) => {
      let mappedStatus: "CONFIRMADO" | "AGUARDANDO" | "CANCELADO" | "CONCLUIDO" = "AGUARDANDO";
      if (apt.status === StatusAppointment.CONFIRMADO) mappedStatus = "CONFIRMADO";
      else if (apt.status === StatusAppointment.CANCELADO) mappedStatus = "CANCELADO";
      else if (apt.status === StatusAppointment.CONCLUIDO) mappedStatus = "CONCLUIDO";

      return {
        id: apt.id,
        horario: `${apt.horarioInicio} - ${apt.horarioFim}`,
        horarioInicio: apt.horarioInicio,
        horarioFim: apt.horarioFim,
        data: apt.data.toISOString().split("T")[0],
        cliente: {
          id: apt.lead.id,
          nome: apt.lead.nomeCompleto,
          telefone: apt.lead.telefone,
          tipoAtendimento: apt.lead.tipoAtendimento,
          convenio: apt.lead.nomeConvenio,
        },
        servico: apt.servico,
        profissional: apt.profissional,
        status: mappedStatus,
      };
    });
  }
}

