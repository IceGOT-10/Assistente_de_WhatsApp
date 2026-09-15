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

export interface ProfessionalItem {
  id: string;
  nome: string;
  especialidade: string;
  corIdentificador?: string | null;
  ativo: boolean;
}

export interface ServiceItem {
  id: string;
  nome: string;
  duracaoMinutos: number;
  precoBase?: number | null;
  ativo: boolean;
}

export interface CreateAppointmentDTO {
  leadId?: string;
  nomeCompleto: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento?: "PARTICULAR" | "CONVENIO";
  nomeConvenio?: string | null;
  data: string; // "YYYY-MM-DD"
  horarioInicio: string;
  horarioFim?: string;
  profissional: string;
  professionalId?: string | null;
  serviceId?: string | null;
  observacoes?: string | null;
}

