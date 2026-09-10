import { ENV } from "../config/env";

interface FastRule {
  intent: string;
  keywords: string[];
  reply: string;
  exactOnly?: boolean;
}

export class QuickRepliesService {
  private static normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static rules: FastRule[] = [
    {
      intent: "SAUDACAO_ISOLADA",
      exactOnly: true,
      keywords: [
        "oi", "ola", "opa", "oie", "bom dia", "boa tarde", "boa noite",
        "ola sofia", "oi sofia", "hey", "ei", "alo", "salve", "tudo bem",
        "ola tudo bem", "oi tudo bem", "como vai", "tudo bom", "e ai",
      ],
      reply: `Olá! Tudo ótimo por aqui, e com você? 😊\n\nSou a Sofia, assistente virtual da ${ENV.CLINIC_NAME}. Como posso te ajudar hoje? Se você busca agendar uma consulta ou avaliação, realizo seu pré-cadastro por aqui mesmo!`,
    },
    {
      intent: "LISTA_PROCEDIMENTOS",
      keywords: [
        "quais os procedimentos", "quais procedimentos", "o que voces fazem",
        "quais servicos", "servicos oferecidos", "tratamentos disponiveis",
        "tabela de procedimentos", "especialidades", "tratamentos",
      ],
      reply: `🦷 *Tratamentos e Especialidades na ${ENV.CLINIC_NAME}:*\n\n• *Clínica Geral:* Limpeza profilática, restaurações e extrações.\n• *Estética Dental:* Clareamento dental a laser/caseiro e facetas.\n• *Ortodontia:* Aparelhos fixos convencionais e alinhadores invisíveis.\n• *Implantodontia e Próteses:* Reabilitação oral e implantes.\n• *Harmonização Orofacial:* Aplicação de Botox.\n\nQual desses procedimentos você gostaria de realizar ou avaliar?`,
    },
    {
      intent: "PRECOS_E_VALORES",
      keywords: [
        "quanto custa", "qual o valor", "qual o preco", "preco", "precos",
        "valores", "tabela de precos", "quanto e", "orcamento", "valor da consulta",
        "valor",
      ],
      reply: `Como cada paciente possui necessidades específicas e os procedimentos odontológicos dependem de avaliação anatômica prévia, não fornecemos valores fechados antes da consulta presencial com nossos dentistas.\n\nPodemos fazer o seu pré-agendamento de avaliação agora mesmo! Qual procedimento você gostaria de realizar?`,
    },
    {
      intent: "LOCALIZACAO",
      keywords: ["endereco", "localizacao", "onde fica", "onde voces ficam", "onde e a clinica", "como chegar", "qual o bairro", "ponto de referencia", "qual a rua", "mapa"],
      reply: `📍 *Endereço da ${ENV.CLINIC_NAME}:*\n\nEstamos localizados na Av. Central, nº 1000 - Sala 402, Centro Empresarial Prime.\nContamos com estacionamento conveniado no local!\n\nGostaria de agendar uma avaliação presencial?`,
    },
    {
      intent: "HORARIO",
      keywords: ["horario", "que horas", "funciona ate", "aberto", "abrem", "sabado", "domingo", "expediente", "plantao"],
      reply: `⏰ *Horários de Atendimento da ${ENV.CLINIC_NAME}:*\n\n• *Segunda a Sexta:* das 08h às 19h\n• *Sábados:* das 08h às 13h\n• *Domingos e Feriados:* Fechado\n\nPodemos deixar um horário pré-reservado para você?`,
    },
    {
      intent: "PAGAMENTO",
      keywords: ["pagamento", "pix", "cartao", "credito", "debito", "parcela", "parcelam", "parcelamento", "boleto", "dinheiro", "desconto a vista"],
      reply: `💳 *Formas de Pagamento na ${ENV.CLINIC_NAME}:*\n\n• *PIX e Dinheiro:* com condições especiais à vista.\n• *Cartões de Crédito:* em até 12x.\n• *Cartões de Débito.*`,
    },
    {
      intent: "CONVENIOS_GERAL",
      keywords: ["convenio", "convenios", "plano de saude", "planos de saude", "plano odontologico", "aceita plano"],
      reply: `🏥 *Atendimento a Convênios:*\n\nAtendemos de forma particular e com cobertura via operadoras parceiras (Amil, Bradesco Dental, SulAmérica, OdontoPrev, Unimed Odonto).\n\nQual é o nome do seu convênio e qual tratamento deseja realizar?`,
    },
    {
      intent: "CLAREAMENTO",
      keywords: ["clareamento", "clarear os dentes", "clareamento dental", "clareamento a laser", "clareamento caseiro"],
      reply: `✨ *Clareamento Dental na ${ENV.CLINIC_NAME}:*\n\nRealizamos tanto o Clareamento a Laser em consultório quanto o Clareamento Caseiro supervisionado, com rapidez e segurança.\n\nPara agendarmos sua avaliação, informe:\n1. Seu *nome completo*\n2. Atendimento *particular ou convênio*\n3. Preferência de turno (*manhã ou tarde*)`,
    },
    {
      intent: "LIMPEZA",
      keywords: ["limpeza", "profilaxia", "tartaro", "placa bacteriana", "limpeza dental"],
      reply: `🦷 *Limpeza Dental (Profilaxia):*\n\nNosso procedimento inclui remoção completa de tártaro, profilaxia com jato de bicarbonato e aplicação de flúor.\n\nPara agendarmos, informe seu *nome completo*, se prefere *particular ou convênio* e o turno de preferência (*manhã ou tarde*).`,
    },
    {
      intent: "BOTOX",
      keywords: ["botox", "toxina botulinica", "harmonizacao", "harmonizacao facial"],
      reply: `🌸 *Harmonização e Botox:*\n\nTrabalhamos com aplicação estética e terapêutica de toxina botulínica realizada por especialistas.\n\nPara agendar uma avaliação, qual seu *nome completo* e qual turno prefere (*manhã ou tarde*)?`,
    },
    {
      intent: "AGRADECIMENTO",
      keywords: ["obrigado", "obrigada", "valeu", "show", "tchau", "ate logo", "agradeco"],
      reply: `Por nada! A equipe da ${ENV.CLINIC_NAME} está à disposição para cuidar do seu sorriso. Tenha um excelente dia! ✨`,
    },
  ];

  public static getQuickReply(rawText: string): string | null {
    const text = this.normalize(rawText);

    for (const rule of this.rules) {
      if (rule.exactOnly) {
        if (rule.keywords.some((kw) => text === this.normalize(kw))) {
          return rule.reply;
        }
      } else if (rule.keywords.some((kw) => text.includes(this.normalize(kw)))) {
        return rule.reply;
      }
    }

    return null;
  }
}
