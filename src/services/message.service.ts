import { PrismaClient, MessageSender } from "@prisma/client";

const prisma = new PrismaClient();

export class MessageService {
  /**
   * Salva uma mensagem no histórico persistente do banco e atualiza a última interação da sessão.
   */
  public static async salvarMensagem(params: {
    telefone: string;
    remoteJid: string;
    texto: string;
    remetente: MessageSender;
    lida?: boolean;
  }) {
    try {
      const telefoneLimpo = params.telefone.replace(/\D/g, "");
      
      // Busca se já existe lead correspondente para vincular
      const lead = await prisma.lead.findUnique({
        where: { telefone: telefoneLimpo },
        select: { id: true },
      });

      // Atualiza o remoteJid e ultimaInteracao na SessionControl
      await prisma.sessionControl.upsert({
        where: { telefone: telefoneLimpo },
        update: {
          remoteJid: params.remoteJid,
          ultimaInteracao: new Date(),
        },
        create: {
          telefone: telefoneLimpo,
          remoteJid: params.remoteJid,
          ultimaInteracao: new Date(),
          atendimentoAtivo: true,
          iaPausada: false,
        },
      });

      return await prisma.message.create({
        data: {
          telefone: telefoneLimpo,
          remoteJid: params.remoteJid,
          texto: params.texto,
          remetente: params.remetente,
          leadId: lead?.id ?? null,
          lida: params.lida ?? params.remetente !== MessageSender.PACIENTE,
        },
      });
    } catch (error) {
      console.error("[MessageService] Erro ao salvar mensagem no banco:", error);
      return null;
    }
  }

  /**
   * Registra log de ação da IA para estatísticas diárias
   */
  public static async registrarAcaoIa(tipo: string, telefone: string, detalhes?: string) {
    try {
      const telefoneLimpo = telefone.replace(/\D/g, "");
      return await prisma.aiActionLog.create({
        data: {
          tipo,
          telefone: telefoneLimpo,
          detalhes,
        },
      });
    } catch (error) {
      console.error("[MessageService] Erro ao registrar ação da IA:", error);
      return null;
    }
  }
}

