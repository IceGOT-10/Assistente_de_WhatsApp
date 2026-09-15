export type MessageSender = "PACIENTE" | "IA" | "ATENDENTE";

export interface ChatMessage {
  id: string;
  telefone: string;
  remoteJid: string;
  texto: string;
  remetente: MessageSender;
  lida: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  telefone: string;
  remoteJid: string;
  nome: string;
  avatarInitials: string;
  ultimaMensagem: string;
  ultimaInteracao: string;
  naoLidas: number;
  iaPausada: boolean;
  procedimento?: string | null;
  tipoAtendimento?: string | null;
  statusAba: "IA" | "AGUARDANDO" | "RESOLVIDA";
}

