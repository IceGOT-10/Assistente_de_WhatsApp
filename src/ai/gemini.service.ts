import { ENV } from "../config/env";
import { SYSTEM_INSTRUCTION } from "./prompts/systemPrompt";
import { cadastrarTriagemPacienteTool } from "./tools/triageTool";
import { LeadService, TriagemData } from "../services/lead.service";

type MessageHistory = {
  role: "user" | "model";
  text: string;
};

export class GeminiService {
  private static userHistories = new Map<string, MessageHistory[]>();
  private static aiInstance: any = null;

  private static async getClient() {
    if (!this.aiInstance) {
      const { GoogleGenAI } = await (eval('import("@google/genai")') as Promise<{ GoogleGenAI: any }>);
      this.aiInstance = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    }
    return this.aiInstance;
  }

  public static registrarNoHistorico(remoteJid: string, userText: string, modelReply: string) {
    const history = this.userHistories.get(remoteJid) || [];
    history.push({ role: "user", text: userText });
    history.push({ role: "model", text: modelReply });
    if (history.length > 20) history.splice(0, history.length - 20);
    this.userHistories.set(remoteJid, history);
  }

  public static limparHistorico(remoteJid: string) {
    this.userHistories.delete(remoteJid);
    console.log(`🧹 [Histórico Limpo] Sessão reiniciada para ${remoteJid}`);
  }

  private static async callWithRetry(ai: any, params: any, maxRetries = 3): Promise<any> {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent(params);
      } catch (error: any) {
        const isTransient = error?.status === 503 || error?.status === 429 || error?.message?.includes("high demand");
        if (isTransient && attempt < maxRetries) {
          console.warn(`[GeminiService] Instabilidade transitória (${error.status || '503'}). Tentativa ${attempt} de ${maxRetries} em ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }
  }

  public static async processarMensagem(remoteJid: string, incomingText: string): Promise<string> {
    const telefoneLimpo = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");

    const { pausada, expirada } = await LeadService.verificarEAtualizarSessao(telefoneLimpo);
    if (pausada) {
      return "⚠️ Seu atendimento já foi transferido para nossa equipe de recepção. Um atendente humano responderá em breve!";
    }

    if (expirada) {
      this.limparHistorico(remoteJid);
    }

    const history = this.userHistories.get(remoteJid) || [];
    history.push({ role: "user", text: incomingText });

    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    try {
      const ai = await this.getClient();

      const contents = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));

      const response = await this.callWithRetry(ai, {
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [cadastrarTriagemPacienteTool as any] }],
          temperature: 0.3,
        },
      });

      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "cadastrar_triagem_paciente") {
            const args = call.args as unknown as TriagemData;
            args.telefone = args.telefone || telefoneLimpo;
            await LeadService.salvarTriagem(args);

            const modalidadeTexto = args.tipo_atendimento === "CONVENIO" && args.nome_convenio
              ? `pelo convênio ${args.nome_convenio}`
              : "particular";

            const turnoTexto = args.periodo_preferencia && args.periodo_preferencia !== "QUALQUER"
              ? ` para o turno da ${args.periodo_preferencia.toLowerCase()}`
              : "";

            const confirmacao = `Perfeito, ${args.nome_completo}! Já registrei sua solicitação para ${args.procedimento} (${modalidadeTexto}${turnoTexto}).\n\nNossa recepção entrará em contato em breve para confirmar o horário exato. Você gostaria de alterar alguma informação ou podemos encerrar por aqui?`;

            history.push({ role: "model", text: confirmacao });
            this.userHistories.set(remoteJid, history);
            return confirmacao;
          }
        }
      }

      let reply = "";
      try {
        reply = response.text || "";
      } catch {
        reply = "Entendido! Como posso ajudar você?";
      }

      if (reply.includes("[PAUSAR_IA]")) {
        await LeadService.pausarIA(telefoneLimpo, 60);
        let cleanedReply = reply.replace("[PAUSAR_IA]", "").trim();
        if (!cleanedReply) {
          cleanedReply = "Com certeza! Estou pausando meu atendimento e transferindo você para a nossa recepção humana. Em instantes um de nossos atendentes falará com você por aqui! 👩‍💼";
        }
        history.push({ role: "model", text: cleanedReply });
        this.userHistories.set(remoteJid, history);
        return cleanedReply;
      }

      if (reply.includes("[ENCERRAR_ATENDIMENTO]")) {
        await LeadService.encerrarAtendimento(telefoneLimpo);
        this.limparHistorico(remoteJid);
        return reply.replace("[ENCERRAR_ATENDIMENTO]", "").trim();
      }

      if (!reply) {
        reply = "Entendido! Caso precise de mais algo, estou à disposição.";
      }

      history.push({ role: "model", text: reply });
      this.userHistories.set(remoteJid, history);

      return reply;
    } catch (error) {
      console.error("[GeminiService] Erro ao comunicar com API:", error);
      return "Olá! Tivemos uma oscilação momentânea em nosso sistema de mensagens. Um atendente da clínica falará com você em breve!";
    }
  }
}
