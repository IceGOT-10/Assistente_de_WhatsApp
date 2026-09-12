export type LeadStatus =
  | "NOVO"
  | "AGUARDANDO_CONFIRMACAO"
  | "AGENDADO"
  | "TRANSBORDO_HUMANO";

export type TipoAtendimento = "PARTICULAR" | "CONVENIO";

export type PeriodoPreferencia = "MANHA" | "TARDE" | "QUALQUER" | null;

export interface Lead {
  id: string;
  nomeCompleto: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento: TipoAtendimento;
  nomeConvenio?: string | null;
  periodoPreferencia?: PeriodoPreferencia;
  status: LeadStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ColumnConfig {
  key: LeadStatus;
  label: string;
  shortLabel: string;
  description: string;
  color: {
    border: string;
    badge: string;
    bg: string;
    accent: string;
    dot: string;
    headerBg: string;
  };
}

export interface DashboardStats {
  totalLeads: number;
  aguardandoConfirmacao: number;
  agendados: number;
  taxaConversao: number;
  novosLeads: number;
  transbordoHumano: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

