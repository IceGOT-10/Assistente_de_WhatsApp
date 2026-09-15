export interface CustomerItem {
  id: string;
  nomeCompleto: string;
  iniciais: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento: "PARTICULAR" | "CONVENIO" | string;
  nomeConvenio?: string | null;
  status: string;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
  totalConsultas: number;
  ultimoAtendimento?: string | null;
}

export interface CustomerListResponse {
  customers: CustomerItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

