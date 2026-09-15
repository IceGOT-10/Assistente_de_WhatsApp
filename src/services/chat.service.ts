import { PrismaClient, MessageSender } from "@prisma/client";
import { WhatsAppGateway } from "../gateway/whatsapp";
import { MessageService } from "./message.service";
import { LeadService } from "./lead.service";

const prisma = new PrismaClient();

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

export class ChatService {
  /**
   * Lista todas as conversas agrupadas por contato com última mensagem, contadores e status de IA.
   */
  public static async listConversations(): Promise<ConversationSummary[]> {
    // 1. Busca todas as sessões ou contatos com mensagens
    const sessions = await prisma.sessionControl.findMany({
      orderBy: { ultimaInteracao: "desc" },
    });

    const leads = await prisma.lead.findMany();
    const leadsMap = new Map(leads.map((l) => [l.telefone, l]));

    const summaries: ConversationSummary[] = [];

    for (const session of sessions) {
      const cleanTelefone = session.telefone;
      const lead = leadsMap.get(cleanTelefone);

      // Última mensagem registrada
      const lastMessage = await prisma.message.findFirst({
        where: { telefone: cleanTelefone },
        orderBy: { createdAt: "desc" },
      });

      // Contagem de não lidas enviadas pelo paciente
      const naoLidas = await prisma.message.count({
        where: {
          telefone: cleanTelefone,
          remetente: MessageSender.PACIENTE,
          lida: false,
        },
      });

      const targetJid = session.remoteJid || `${cleanTelefone}@s.whatsapp.net`;
      const nome = lead?.nomeCompleto || `Paciente (${cleanTelefone})`;

      const initials = nome
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      let statusAba: "IA" | "AGUARDANDO" | "RESOLVIDA" = "IA";
      if (session.iaPausada) {
        statusAba = "AGUARDANDO";
      } else if (!session.atendimentoAtivo) {
        statusAba = "RESOLVIDA";
      }

      summaries.push({
        telefone: cleanTelefone,
        remoteJid: targetJid,
        nome,
        avatarInitials: initials || "PA",
        ultimaMensagem: lastMessage?.texto || "Atendimento iniciado",
        ultimaInteracao: (lastMessage?.createdAt || session.ultimaInteracao).toISOString(),
        naoLidas,
        iaPausada: session.iaPausada,
        procedimento: lead?.procedimento || null,
        tipoAtendimento: lead?.tipoAtendimento || null,
        statusAba,
      });
    }

    // Se houver leads cadastrados que ainda não têm SessionControl, adiciona como novas conversas
    for (const lead of leads) {
      if (!sessions.some((s) => s.telefone === lead.telefone)) {
        const lastMessage = await prisma.message.findFirst({
          where: { telefone: lead.telefone },
          orderBy: { createdAt: "desc" },
        });

        const initials = lead.nomeCompleto
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase();

        summaries.push({
          telefone: lead.telefone,
          remoteJid: `${lead.telefone}@s.whatsapp.net`,
          nome: lead.nomeCompleto,
          avatarInitials: initials || "PA",
          ultimaMensagem: lastMessage?.texto || `Triagem: ${lead.procedimento}`,
          ultimaInteracao: (lastMessage?.createdAt || lead.updatedAt).toISOString(),
          naoLidas: 0,
          iaPausada: false,
          procedimento: lead.procedimento,
          tipoAtendimento: lead.tipoAtendimento,
          statusAba: "IA",
        });
      }
    }

    return summaries.sort(
      (a, b) => new Date(b.ultimaInteracao).getTime() - new Date(a.ultimaInteracao).getTime()
    );
  }

  /**
   * Obtém o histórico cronológico de mensagens de um telefone.
   */
  public static async getMessages(telefone: string) {
    const cleanTelefone = telefone.replace(/\D/g, "");

    return await prisma.message.findMany({
      where: { telefone: cleanTelefone },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        telefone: true,
        remoteJid: true,
        texto: true,
        remetente: true,
        lida: true,
        createdAt: true,
      },
    });
  }

  /**
   * Envia uma mensagem pelo atendente da recepção.
   * Dispara via Baileys no remoteJid correto (suportando padrão e @lid) e persiste no PostgreSQL.
   */
  public static async sendMessage(telefone: string, texto: string) {
    const cleanTelefone = telefone.replace(/\D/g, "");

    // Busca o remoteJid original salvo na sessão
    const session = await prisma.sessionControl.findUnique({
      where: { telefone: cleanTelefone },
    });

    const targetRemoteJid = session?.remoteJid || `${cleanTelefone}@s.whatsapp.net`;

    // 1. Envia via Baileys se o socket estiver conectado
    if (WhatsAppGateway.sock) {
      try {
        await WhatsAppGateway.sock.sendMessage(targetRemoteJid, { text: texto });
        console.log(`💬 [Chat Atendente] Mensagem enviada via Baileys para ${targetRemoteJid}: ${texto}`);
      } catch (err) {
        console.warn(`[Chat Atendente] Aviso ao enviar via Baileys para ${targetRemoteJid}:`, err);
      }
    } else {
      console.log(`ℹ️ [Chat Atendente] Gateway desconectado. Mensagem gravada localmente para ${targetRemoteJid}.`);
    }

    // 2. Grava no PostgreSQL como remetente ATENDENTE
    const message = await MessageService.salvarMensagem({
      telefone: cleanTelefone,
      remoteJid: targetRemoteJid,
      texto,
      remetente: MessageSender.ATENDENTE,
      lida: true,
    });

    // 3. Pausa a IA por 60 min automaticamente, pois um atendente humano respondeu
    await LeadService.pausarIA(cleanTelefone, 60);

    return message;
  }

  /**
   * Intervenção humana: Atendente assume o atendimento e pausa a IA.
   */
  public static async takeover(telefone: string) {
    const cleanTelefone = telefone.replace(/\D/g, "");

    await LeadService.pausarIA(cleanTelefone, 60);
    await MessageService.registrarAcaoIa("TRANSBORDO", cleanTelefone, "Atendente assumiu a conversa");

    const session = await prisma.sessionControl.findUnique({
      where: { telefone: cleanTelefone },
    });

    const targetRemoteJid = session?.remoteJid || `${cleanTelefone}@s.whatsapp.net`;

    // Registra aviso no chat
    const aviso = "👩‍💼 Um atendente da nossa recepção assumiu este atendimento. A assistente de IA foi pausada.";
    await MessageService.salvarMensagem({
      telefone: cleanTelefone,
      remoteJid: targetRemoteJid,
      texto: aviso,
      remetente: MessageSender.ATENDENTE,
      lida: true,
    });

    return {
      success: true,
      message: `Atendimento assumido pela recepção para ${cleanTelefone}. IA pausada.`,
    };
  }

  /**
   * Marca as mensagens do contato como lidas.
   */
  public static async markAsRead(telefone: string) {
    const cleanTelefone = telefone.replace(/\D/g, "");

    return await prisma.message.updateMany({
      where: {
        telefone: cleanTelefone,
        remetente: MessageSender.PACIENTE,
        lida: false,
      },
      data: { lida: true },
    });
  }
}

