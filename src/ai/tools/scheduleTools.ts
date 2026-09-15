export const consultarHorariosDisponiveisTool = {
  name: "consultar_horarios_disponiveis",
  description:
    "Consulta os horários vagos e disponíveis na clínica para atendimento em uma data específica. Use sempre que o paciente perguntar sobre horários livres ou quiser saber quando pode vir.",
  parameters: {
    type: "OBJECT",
    properties: {
      data: {
        type: "STRING",
        description:
          "Data pretendida no formato YYYY-MM-DD (ex: 2026-09-20). Se o paciente falar 'amanhã' ou 'quinta-feira', deduza a data correspondente.",
      },
      profissional: {
        type: "STRING",
        description:
          "Nome ou preferência de dentista/profissional (opcional, ex: Dra. Camila Duarte, Dr. Lucas Ramos).",
      },
      servico: {
        type: "STRING",
        description:
          "Procedimento ou serviço de interesse (opcional, ex: Avaliação Geral, Limpeza, Clareamento).",
      },
    },
    required: ["data"],
  },
};

export const cancelarConsultaTool = {
  name: "cancelar_consulta",
  description:
    "Cancela um agendamento ou consulta ativa do paciente no sistema. Use quando o paciente solicitar explicitamente o cancelamento da sua consulta.",
  parameters: {
    type: "OBJECT",
    properties: {
      telefone: {
        type: "STRING",
        description:
          "Telefone do paciente cadastrado na consulta (opcional se for o próprio paciente da conversa).",
      },
      lead_id: {
        type: "STRING",
        description: "Identificador do lead/paciente, se conhecido (opcional).",
      },
      motivo: {
        type: "STRING",
        description:
          "Motivo do cancelamento informado pelo paciente (ex: imprevisto no trabalho, viagem, motivos de saúde).",
      },
    },
  },
};

