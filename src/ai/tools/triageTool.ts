export const cadastrarTriagemPacienteTool = {
  name: "cadastrar_triagem_paciente",
  description: "Salva os dados coletados do paciente no banco de dados e notifica a equipe da recepção para formalizar o agendamento.",
  parameters: {
    type: "OBJECT",
    properties: {
      nome_completo: {
        type: "STRING",
        description: "Nome do paciente informado na conversa"
      },
      telefone: {
        type: "STRING",
        description: "Número de contato verificado do WhatsApp"
      },
      procedimento: {
        type: "STRING",
        description: "Serviço odontológico ou estético de interesse informado pelo paciente"
      },
      tipo_atendimento: {
        type: "STRING",
        enum: ["PARTICULAR", "CONVENIO"],
        description: "Modalidade de pagamento pretendida"
      },
      nome_convenio: {
        type: "STRING",
        description: "Nome da operadora de saúde caso seja convênio"
      },
      periodo_preferencia: {
        type: "STRING",
        enum: ["MANHA", "TARDE", "QUALQUER"],
        description: "Turno mais conveniente para o atendimento"
      }
    },
    required: ["nome_completo", "procedimento", "tipo_atendimento"]
  }
};
