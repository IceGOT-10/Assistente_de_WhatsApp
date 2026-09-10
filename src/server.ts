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
    res.json({ success: true, message: "WhatsApp desconectado. Novo QR Code disponível no terminal do servidor." });
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
    res.json({ success: true, message: `Atendimento resetado com sucesso para ${telefone}` });
  } catch (error) {
    res.status(500).json({ error: "Erro ao resetar atendimento" });
  }
});

app.post("/api/test/simulate-message", async (req, res) => {
  const { remoteJid, text } = req.body;
  if (!remoteJid || !text) {
    return res.status(400).json({ error: "remoteJid e text são obrigatórios" });
  }

  console.log(`\n📩 [Simulador] Mensagem Recebida de ${remoteJid}:\n${text}`);

  const quickReply = QuickRepliesService.getQuickReply(text);
  if (quickReply) {
    GeminiService.registrarNoHistorico(remoteJid, text, quickReply);
    console.log(`⚡ [Simulador] Resposta Rápida:\n${quickReply}\n`);
    return res.json({ reply: quickReply, source: "quick_reply" });
  }

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
          await WhatsAppGateway.sock.sendMessage(jid, { text: mensagemDespedida });
          console.log(`⏰ [Auto-Encerramento Ativo] Notificação de inatividade enviada para ${jid}`);
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

    const quickReply = QuickRepliesService.getQuickReply(consolidatedText);
    if (quickReply) {
      if (WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, { text: quickReply });
        console.log(`⚡ [Resposta Rápida Pré-Feita Enviada]:\n${quickReply}\n`);
        GeminiService.registrarNoHistorico(remoteJid, consolidatedText, quickReply);
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
      if (timeoutAviso) clearTimeout(timeoutAviso);

      if (botReply && WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, { text: botReply });
        console.log(`🤖 [Resposta Enviada]:\n${botReply}\n`);
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
