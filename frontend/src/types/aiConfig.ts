export interface AiPermissions {
  consultarHorarios: boolean;
  criarAgendamentos: boolean;
  reagendar: boolean;
  cancelar: boolean;
  confirmarAtendimento: boolean;
  responderDuvidas: boolean;
}

export interface AiTriggers {
  pedirHumano: boolean;
  reclamacao: boolean;
  situacaoNaoIdentificada: boolean;
}

export interface AiConfigData {
  id: string;
  iaAtiva: boolean;
  nomeAssistente: string;
  mensagemInicial: string;
  permissoes: AiPermissions;
  gatilhosTransbordo: AiTriggers;
  updatedAt?: string;
}

