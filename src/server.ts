import express from "express";
import { PrismaClient } from "@prisma/client";
import { ENV } from "./config/env";
import { WhatsAppGateway } from "./gateway/whatsapp";
import { GeminiService } from "./ai/gemini.service";
import { LeadService } from "./services/lead.service";
import { QuickRepliesService } from "./services/quickReplies.service";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "online", clinic: ENV.CLINIC_NAME });
});

app.get("/api/leads", async (req, res) => {
  try {
    const leads = await LeadService.listarLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar leads" });
  }
});

app.post("/api/whatsapp/disconnect", async (req, res) => {
  try {
    await WhatsAppGateway.desconectarEReiniciar();
    res.json({ success: true, message: "WhatsApp desconectado. Escaneie o novo QR Code caso o gateway esteja ativo." });
  } catch (error) {
    console.error("Erro ao desconectar WhatsApp:", error);
    res.status(500).json({ error: "Erro ao desvincular WhatsApp" });
  }
});

app.post("/api/sessions/:telefone/reset", async (req, res) => {
  try {
    const { telefone } = req.params;
    await LeadService.encerrarAtendimento(telefone);
    GeminiService.limparHistorico(`${telefone}@s.whatsapp.net`);
    GeminiService.limparHistorico(`${telefone}@lid`);
    GeminiService.limparHistorico(telefone);
    console.log(`🔄 [Reset] Sessão e pausa da IA totalmente liberadas para ${telefone}`);
    res.json({ success: true, message: `Atendimento e pausa resetados com sucesso para ${telefone}` });
  } catch (error) {
    console.error("Erro ao resetar atendimento:", error);
    res.status(500).json({ error: "Erro ao resetar atendimento" });
  }
});

app.post("/api/test/simulate-message", async (req, res) => {
  const { remoteJid, text } = req.body;
  if (!remoteJid || !text) {
    return res.status(400).json({ error: "remoteJid e text são obrigatórios" });
  }

  const telefoneLimpo = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
  console.log(`\n📩 [Simulador] Mensagem Recebida de ${remoteJid}:\n${text}`);

  // 1. Checa se o atendimento está transferido para humano ANTES de qualquer resposta
  const pausada = await LeadService.isIaPausada(telefoneLimpo);
  if (pausada) {
    const avisoPausa = "⚠️ Seu atendimento já foi transferido para nossa equipe de recepção. Um atendente humano responderá em breve!";
    console.log(`⏸️ [Simulador] Atendimento pausado para humano: ${telefoneLimpo}`);
    return res.json({ reply: avisoPausa, source: "gemini" });
  }

  // 2. Roteamento Híbrido Rápido (só entra se não estiver pausado)
  const quickReply = QuickRepliesService.getQuickReply(text);
  if (quickReply) {
    let cleanReply = quickReply;
    if (quickReply.includes("[PAUSAR_IA]")) {
      await LeadService.pausarIA(telefoneLimpo, 60);
      cleanReply = quickReply.replace("[PAUSAR_IA]", "").trim();
    }

    GeminiService.registrarNoHistorico(remoteJid, text, cleanReply);
    console.log(`⚡ [Simulador] Resposta Rápida:\n${cleanReply}\n`);
    return res.json({ reply: cleanReply, source: "quick_reply" });
  }

  // 3. Processamento Cognitivo Gemini
  try {
    const botReply = await GeminiService.processarMensagem(remoteJid, text);
    console.log(`🤖 [Simulador] Resposta Gemini:\n${botReply}\n`);
    return res.json({ reply: botReply, source: "gemini" });
  } catch (error) {
    console.error(`[Simulador] Erro ao processar mensagem de ${remoteJid}:`, error);
    return res.status(500).json({ error: "Erro interno no processamento da mensagem" });
  }
});

function iniciarMonitorDeInatividade() {
  const INTERVALO_VERIFICACAO_MS = 60 * 1000;
  const LIMITE_INATIVIDADE_MINUTOS = 15;

  setInterval(async () => {
    try {
      const limiteData = new Date(Date.now() - LIMITE_INATIVIDADE_MINUTOS * 60 * 1000);

      const sessoesExpiradas = await prisma.sessionControl.findMany({
        where: {
          atendimentoAtivo: true,
          iaPausada: false,
          ultimaInteracao: { lt: limiteData },
        },
      });

      for (const sessao of sessoesExpiradas) {
        await LeadService.encerrarAtendimento(sessao.telefone);
        const jid = `${sessao.telefone}@s.whatsapp.net`;
        GeminiService.limparHistorico(jid);
        GeminiService.limparHistorico(`${sessao.telefone}@lid`);

        const mensagemDespedida = "Como não tivemos novas mensagens por alguns minutos, estou finalizando este atendimento para manter seus dados seguros. Se precisar de algo mais, basta mandar um novo 'Oi'! Tenha um ótimo dia! ✨";

        if (WhatsAppGateway.sock) {
          try {
            await WhatsAppGateway.sock.sendMessage(jid, { text: mensagemDespedida });
            console.log(`⏰ [Auto-Encerramento Ativo] Notificação de inatividade enviada para ${jid}`);
          } catch (e) {
            console.warn(`[Auto-Encerramento] Não foi possível notificar via WhatsApp para ${jid}`);
          }
        }
      }
    } catch (err) {
      console.error("[MonitorInatividade] Erro ao verificar sessões expiradas:", err);
    }
  }, INTERVALO_VERIFICACAO_MS);
}

async function bootstrap() {
  app.listen(ENV.PORT, () => {
    console.log(`🚀 [Servidor HTTP] Operando na porta ${ENV.PORT}`);
    iniciarMonitorDeInatividade();
  });

  await WhatsAppGateway.init(async (remoteJid, consolidatedText) => {
    console.log(`\n📩 [Mensagem Recebida de ${remoteJid}]:\n${consolidatedText}`);

    const telefoneLimpo = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");

    // Se a IA estiver pausada para atendente humano, não manda Quick Reply
    const pausada = await LeadService.isIaPausada(telefoneLimpo);
    if (pausada) {
      return; // O bot fica em silêncio no WhatsApp real aguardando o humano
    }

    const quickReply = QuickRepliesService.getQuickReply(consolidatedText);
    if (quickReply) {
      let cleanReply = quickReply;
      if (quickReply.includes("[PAUSAR_IA]")) {
        await LeadService.pausarIA(telefoneLimpo, 60);
        cleanReply = quickReply.replace("[PAUSAR_IA]", "").trim();
      }

      if (WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, { text: cleanReply });
        console.log(`⚡ [Resposta Rápida Pré-Feita Enviada]:\n${cleanReply}\n`);
        GeminiService.registrarNoHistorico(remoteJid, consolidatedText, cleanReply);
      }
      return;
    }

    let timeoutAviso: NodeJS.Timeout | null = null;
    const tempoLimiteMs = 4000;

    timeoutAviso = setTimeout(async () => {
      if (WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, {
          text: "Só um momento, estou consultando as informações para você... ⏳",
        });
        console.log(`⏳ [Aviso de Espera Enviado para ${remoteJid}]`);
      }
    }, tempoLimiteMs);

    try {
      const botReply = await GeminiService.processarMensagem(remoteJid, consolidatedText);
      let cleanBotReply = botReply;
      if (botReply.includes("[PAUSAR_IA]")) {
        const telefoneLimpo = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
        await LeadService.pausarIA(telefoneLimpo, 60);
        cleanBotReply = botReply.replace("[PAUSAR_IA]", "").trim();
      }

      if (timeoutAviso) clearTimeout(timeoutAviso);

      if (cleanBotReply && WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, { text: cleanBotReply });
        console.log(`🤖 [Resposta Enviada]:\n${cleanBotReply}\n`);
      }
    } catch (error) {
      if (timeoutAviso) clearTimeout(timeoutAviso);
      console.error(`[Server] Erro ao processar mensagem de ${remoteJid}:`, error);
    }
  });
}

bootstrap().catch((err) => {
  console.error("Erro fatal ao inicializar servidor:", err);
});
