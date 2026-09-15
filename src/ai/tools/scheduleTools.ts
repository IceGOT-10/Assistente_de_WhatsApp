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

export const agendarConsultaTool = {
  name: "agendar_consulta",
  description:
    "Efetiva e confirma o agendamento de uma consulta na grade oficial da clínica. Use quando o paciente confirmar o dia, horário e procedimento desejados para garantir e bloquear imediatamente a vaga no sistema.",
  parameters: {
    type: "OBJECT",
    properties: {
      data: {
        type: "STRING",
        description:
          "Data confirmada da consulta no formato YYYY-MM-DD (ex: 2026-09-20). Se o paciente falar 'amanhã', deduza a data correta.",
      },
      horarioInicio: {
        type: "STRING",
        description:
          "Horário de início da consulta no formato HH:mm (ex: 09:00, 14:30). Deve ser um horário dentro do expediente (08:00 às 18:00) e fora do almoço (12:00 às 13:00).",
      },
      procedimento: {
        type: "STRING",
        description:
          "Procedimento ou serviço odontológico a ser realizado (ex: Avaliação Geral, Limpeza e Profilaxia, Clareamento Dental).",
      },
      profissionalId: {
        type: "STRING",
        description:
          "ID do profissional de preferência caso conhecido (opcional).",
      },
      profissional: {
        type: "STRING",
        description:
          "Nome do profissional/dentista escolhido (opcional, ex: Dra. Camila Duarte, Dr. Lucas Ramos).",
      },
      nome_completo: {
        type: "STRING",
        description:
          "Nome completo do paciente que será atendido (opcional se já informado).",
      },
      telefone: {
        type: "STRING",
        description:
          "Número do WhatsApp do paciente para contato e confirmação (opcional).",
      },
      tipo_atendimento: {
        type: "STRING",
        enum: ["PARTICULAR", "CONVENIO"],
        description: "Modalidade de pagamento pretendida.",
      },
      nome_convenio: {
        type: "STRING",
        description: "Nome da operadora de saúde caso seja convênio.",
      },
    },
    required: ["data", "horarioInicio", "procedimento"],
  },
};

