export interface DashboardStatsData {
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

export interface UpcomingAppointment {
  id: string;
  horario: string;
  horarioInicio: string;
  horarioFim: string;
  data: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
    tipoAtendimento: "PARTICULAR" | "CONVENIO" | string;
    convenio?: string | null;
  };
  servico: string;
  profissional: string;
  status: "CONFIRMADO" | "AGUARDANDO" | "CANCELADO" | "CONCLUIDO";
}

