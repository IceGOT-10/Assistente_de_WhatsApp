export type AppointmentStatus = "AGENDADO" | "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";

export interface AppointmentItem {
  id: string;
  leadId: string;
  data: string; // "YYYY-MM-DD"
  horarioInicio: string; // "09:00"
  horarioFim: string; // "10:00"
  profissional: string;
  servico: string;
  status: AppointmentStatus;
  observacoes?: string | null;
  createdAt: string;
  updatedAt?: string;
  lead: {
    id: string;
    nomeCompleto: string;
    telefone: string;
    procedimento: string;
    tipoAtendimento: "PARTICULAR" | "CONVENIO" | string;
    nomeConvenio?: string | null;
    status: string;
  };
}

export interface CreateAppointmentDTO {
  nomeCompleto: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento?: "PARTICULAR" | "CONVENIO";
  nomeConvenio?: string | null;
  data: string; // "YYYY-MM-DD"
  horarioInicio: string;
  horarioFim: string;
  profissional: string;
  observacoes?: string | null;
}

