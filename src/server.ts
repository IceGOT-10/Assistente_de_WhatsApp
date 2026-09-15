import express from "express";
import cors from "cors";
import { PrismaClient, MessageSender } from "@prisma/client";
import { ENV } from "./config/env";
import { WhatsAppGateway } from "./gateway/whatsapp";
import { GeminiService } from "./ai/gemini.service";
import { LeadService } from "./services/lead.service";
import { QuickRepliesService } from "./services/quickReplies.service";
import { MessageService } from "./services/message.service";
import { AiConfigService } from "./services/aiConfig.service";
import { DashboardService } from "./services/dashboard.service";
import {
  AppointmentService,
  AppointmentConflictError,
  AppointmentValidationError,
} from "./services/appointment.service";
import { ChatService } from "./services/chat.service";
import { CustomerService } from "./services/customer.service";
import { ClinicDataService } from "./services/clinicData.service";
import { AuthService } from "./services/auth.service";
import { authMiddleware, AuthenticatedRequest } from "./middlewares/auth.middleware";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "online", clinic: ENV.CLINIC_NAME });
});

// ==================== AUTENTICAÇÃO E OPERADORES ====================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: any) {
    console.warn(`🔒 [Login] Falha de autenticação para '${req.body?.email}':`, error.message);
    res.status(401).json({ error: error.message || "Credenciais inválidas" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Sessão inválida" });
    }
    const profile = await AuthService.getProfile(req.user.id);
    res.json(profile);
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Sessão expirada" });
  }
});

// ==================== APPOINTMENTS (AGENDA) ====================
app.get("/api/appointments", async (req, res) => {
  try {
    const { startDate, endDate, profissional, status } = req.query;
    const appointments = await AppointmentService.listAppointments({
      startDate: startDate as string,
      endDate: endDate as string,
      profissional: profissional as string,
      status: status as any,
    });
    res.json(appointments);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    res.status(500).json({ error: "Erro ao listar agendamentos" });
  }
});

app.post("/api/appointments", async (req, res) => {
  try {
    const appointment = await AppointmentService.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error: any) {
    if (error instanceof AppointmentConflictError) {
      return res.status(409).json({
        error: error.message,
        code: "DOUBLE_BOOKING_CONFLICT",
      });
    }
    if (error instanceof AppointmentValidationError) {
      return res.status(400).json({
        error: error.message,
        code: "INVALID_SCHEDULE",
      });
    }
    console.error("Erro ao criar agendamento:", error);
    res.status(500).json({ error: error.message || "Erro ao cadastrar agendamento" });
  }
});

app.patch("/api/appointments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await AppointmentService.updateStatus(id, status);
    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar status do agendamento:", error);
    res.status(500).json({ error: "Erro ao atualizar status do agendamento" });
  }
});

app.put("/api/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AppointmentService.updateAppointment(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error instanceof AppointmentConflictError) {
      return res.status(409).json({
        error: error.message,
        code: "DOUBLE_BOOKING_CONFLICT",
      });
    }
    if (error instanceof AppointmentValidationError) {
      return res.status(400).json({
        error: error.message,
        code: "INVALID_SCHEDULE",
      });
    }
    console.error("Erro ao editar agendamento:", error);
    res.status(500).json({ error: error.message || "Erro ao salvar alterações do agendamento" });
  }
});

// ==================== CHAT & WHATSAPP ====================
app.get("/api/chat/conversations", async (req, res) => {
  try {
    const conversations = await ChatService.listConversations();
    res.json(conversations);
  } catch (error) {
    console.error("Erro ao listar conversas:", error);
    res.status(500).json({ error: "Erro ao listar conversas do WhatsApp" });
  }
});

app.get("/api/chat/messages/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;
    const messages = await ChatService.getMessages(telefone);
    res.json(messages);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ error: "Erro ao buscar histórico de mensagens" });
  }
});

app.post("/api/chat/send", async (req, res) => {
  try {
    const { telefone, texto } = req.body;
    if (!telefone || !texto) {
      return res.status(400).json({ error: "Telefone e texto são obrigatórios" });
    }
    const sent = await ChatService.sendMessage(telefone, texto);
    res.status(201).json(sent);
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo atendente:", error);
    res.status(500).json({ error: "Erro ao despachar mensagem pelo WhatsApp" });
  }
});

app.post("/api/chat/takeover/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;
    const result = await ChatService.takeover(telefone);
    res.json(result);
  } catch (error) {
    console.error("Erro ao assumir atendimento:", error);
    res.status(500).json({ error: "Erro ao transferir atendimento" });
  }
});

app.post("/api/chat/resume/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;
    const result = await ChatService.resume(telefone);
    res.json(result);
  } catch (error) {
    console.error("Erro ao retomar atendimento da IA:", error);
    res.status(500).json({ error: "Erro ao reativar assistente virtual" });
  }
});

app.patch("/api/chat/read/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;
    await ChatService.markAsRead(telefone);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    res.status(500).json({ error: "Erro ao atualizar status de leitura" });
  }
});

// ==================== CLIENTES (CUSTOMERS) ====================
app.get("/api/customers", async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await CustomerService.listCustomers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
    });
    res.json(result);
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar lista de clientes" });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const customer = await CustomerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    res.status(500).json({ error: "Erro ao cadastrar novo cliente" });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await CustomerService.updateCustomer(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ error: "Erro ao atualizar dados do cliente" });
  }
});

// ==================== CONFIGURAÇÕES DA IA ====================
app.get("/api/ai/config", async (req, res) => {
  try {
    const config = await AiConfigService.getConfig();
    res.json(config);
  } catch (error) {
    console.error("Erro ao buscar configurações da IA:", error);
    res.status(500).json({ error: "Erro ao buscar parâmetros da IA" });
  }
});

app.put("/api/ai/config", authMiddleware, async (req, res) => {
  try {
    const updated = await AiConfigService.updateConfig(req.body);
    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar configurações da IA:", error);
    res.status(500).json({ error: "Erro ao salvar parâmetros da IA" });
  }
});

app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const stats = await DashboardService.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    res.status(500).json({ error: "Erro ao buscar métricas do dashboard" });
  }
});

app.get("/api/dashboard/upcoming", async (req, res) => {
  try {
    const upcoming = await DashboardService.getUpcomingAppointments();
    res.json(upcoming);
  } catch (error) {
    console.error("Erro ao buscar próximos atendimentos:", error);
    res.status(500).json({ error: "Erro ao buscar próximos atendimentos" });
  }
});

// ==================== PROFISSIONAIS & SERVIÇOS ====================
app.get("/api/professionals", async (req, res) => {
  try {
    const professionals = await ClinicDataService.listProfessionals();
    res.json(professionals);
  } catch (error) {
    console.error("Erro ao listar profissionais:", error);
    res.status(500).json({ error: "Erro ao listar profissionais" });
  }
});

app.get("/api/services", async (req, res) => {
  try {
    const services = await ClinicDataService.listServices();
    res.json(services);
  } catch (error) {
    console.error("Erro ao listar serviços:", error);
    res.status(500).json({ error: "Erro ao listar serviços" });
  }
});

app.get("/api/leads", async (req, res) => {
  try {
    const leads = await LeadService.listarLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar leads" });
  }
});

app.patch("/api/leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const leadAtualizado = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    console.log(`📋 [Lead Atualizado] ${leadAtualizado.nomeCompleto} movido para ${status}`);
    res.json(leadAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar status do lead:", error);
    res.status(500).json({ error: "Erro ao atualizar status do lead" });
  }
});

app.put("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nomeCompleto,
      telefone,
      procedimento,
      tipoAtendimento,
      nomeConvenio,
      periodoPreferencia,
      observacoes,
      status,
    } = req.body;

    const dataToUpdate: any = {
      nomeCompleto,
      telefone: telefone ? telefone.replace(/\D/g, "") : undefined,
      procedimento,
      tipoAtendimento,
      nomeConvenio: tipoAtendimento === "CONVENIO" ? (nomeConvenio || null) : null,
      periodoPreferencia,
    };

    if (observacoes !== undefined) {
      dataToUpdate.observacoes = observacoes;
    }
    if (status) {
      dataToUpdate.status = status;
    }

    const leadAtualizado = await prisma.lead.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(leadAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    res.status(500).json({ error: "Erro ao salvar alterações do lead" });
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

  // Grava mensagem recebida do paciente no banco
  await MessageService.salvarMensagem({
    telefone: telefoneLimpo,
    remoteJid,
    texto: text,
    remetente: MessageSender.PACIENTE,
  });

  // 1. Respeito à Chave Mestra iaAtiva de AiConfig
  const aiConfig = await AiConfigService.getConfig();
  if (!aiConfig.iaAtiva) {
    console.log(`🔇 [Simulador] Automação silenciada para ${remoteJid}: iaAtiva está desativada.`);
    return res.json({
      reply: "⚠️ A assistente virtual está temporariamente desativada pela gerência da clínica.",
      source: "ia_desativada",
    });
  }

  const pausada = await LeadService.isIaPausada(telefoneLimpo);
  if (pausada) {
    const avisoPausa = "⚠️ Seu atendimento já foi transferido para nossa equipe de recepção. Um atendente humano responderá em breve!";
    console.log(`⏸️ [Simulador] Atendimento pausado para humano: ${telefoneLimpo}`);
    await MessageService.salvarMensagem({
      telefone: telefoneLimpo,
      remoteJid,
      texto: avisoPausa,
      remetente: MessageSender.IA,
    });
    return res.json({ reply: avisoPausa, source: "gemini" });
  }

  const quickReply = QuickRepliesService.getQuickReply(text);
  if (quickReply) {
    let cleanReply = quickReply;
    if (quickReply.includes("[PAUSAR_IA]")) {
      await LeadService.pausarIA(telefoneLimpo, 60);
      cleanReply = quickReply.replace("[PAUSAR_IA]", "").trim();
    }

    GeminiService.registrarNoHistorico(remoteJid, text, cleanReply);
    console.log(`⚡ [Simulador] Resposta Rápida:\n${cleanReply}\n`);
    await MessageService.salvarMensagem({
      telefone: telefoneLimpo,
      remoteJid,
      texto: cleanReply,
      remetente: MessageSender.IA,
    });
    return res.json({ reply: cleanReply, source: "quick_reply" });
  }

  try {
    const botReply = await GeminiService.processarMensagem(remoteJid, text);
    console.log(`🤖 [Simulador] Resposta Gemini:\n${botReply}\n`);
    if (botReply) {
      await MessageService.salvarMensagem({
        telefone: telefoneLimpo,
        remoteJid,
        texto: botReply,
        remetente: MessageSender.IA,
      });
    }
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
  // Garante a configuração padrão da IA Sofia e seed de profissionais/serviços
  await AiConfigService.ensureDefaultConfig();
  console.log("⚙️ [AiConfig] Configuração padrão da assistente Sofia inicializada.");

  await ClinicDataService.ensureSeed();
  console.log("👨‍⚕️ [ClinicData] Profissionais e serviços padrão garantidos.");

  await AuthService.ensureDefaultAdmin();
  console.log("👤 [Auth] Administrador padrão inicializado.");

  app.listen(ENV.PORT, () => {
    console.log(`🚀 [Servidor HTTP] Operando na porta ${ENV.PORT}`);
    iniciarMonitorDeInatividade();
  });

  await WhatsAppGateway.init(async (remoteJid, consolidatedText) => {
    console.log(`\n📩 [Mensagem Recebida de ${remoteJid}]:\n${consolidatedText}`);

    const telefoneLimpo = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");

    // Persiste mensagem do paciente
    await MessageService.salvarMensagem({
      telefone: telefoneLimpo,
      remoteJid,
      texto: consolidatedText,
      remetente: MessageSender.PACIENTE,
    });

    // 1. Respeito à Chave Mestra iaAtiva de AiConfig
    const aiConfig = await AiConfigService.getConfig();
    if (!aiConfig.iaAtiva) {
      console.log(`🔇 [WhatsApp] Mensagem de ${remoteJid} ignorada pela automação: iaAtiva está desativada.`);
      return;
    }

    const pausada = await LeadService.isIaPausada(telefoneLimpo);
    if (pausada) {
      return;
    }

    const quickReply = QuickRepliesService.getQuickReply(consolidatedText);
    if (quickReply) {
      let cleanReply = quickReply;
      if (quickReply.includes("[PAUSAR_IA]")) {
        await LeadService.pausarIA(telefoneLimpo, null);
        cleanReply = quickReply.replace("[PAUSAR_IA]", "").trim();
      }

      if (WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, { text: cleanReply });
        console.log(`⚡ [Resposta Rápida Pré-Feita Enviada]:\n${cleanReply}\n`);
        GeminiService.registrarNoHistorico(remoteJid, consolidatedText, cleanReply);
      }

      await MessageService.salvarMensagem({
        telefone: telefoneLimpo,
        remoteJid,
        texto: cleanReply,
        remetente: MessageSender.IA,
      });
      return;
    }

    let timeoutAviso: NodeJS.Timeout | null = null;
    const tempoLimiteMs = 4000;

    timeoutAviso = setTimeout(async () => {
      const textoAviso = "Só um momento, estou consultando as informações para você... ⏳";
      if (WhatsAppGateway.sock) {
        await WhatsAppGateway.sock.sendMessage(remoteJid, {
          text: textoAviso,
        });
        console.log(`⏳ [Aviso de Espera Enviado para ${remoteJid}]`);
      }
      // Observação anti-poluição: Não gravamos o aviso intermediário no MessageService
      // para não contaminar a memória e o histórico contextual do Gemini.
    }, tempoLimiteMs);

    try {
      const botReply = await GeminiService.processarMensagem(remoteJid, consolidatedText);
      if (timeoutAviso) clearTimeout(timeoutAviso);

      if (botReply) {
        if (WhatsAppGateway.sock) {
          await WhatsAppGateway.sock.sendMessage(remoteJid, { text: botReply });
          console.log(`🤖 [Resposta Enviada]:\n${botReply}\n`);
        }
        await MessageService.salvarMensagem({
          telefone: telefoneLimpo,
          remoteJid,
          texto: botReply,
          remetente: MessageSender.IA,
        });
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
