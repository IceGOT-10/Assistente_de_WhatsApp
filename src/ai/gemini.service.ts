import { PrismaClient, MessageSender } from "@prisma/client";
import { ENV } from "../config/env";
import { buildDynamicSystemPrompt } from "./prompts/dynamicPrompt";
import { cadastrarTriagemPacienteTool } from "./tools/triageTool";
import {
  consultarHorariosDisponiveisTool,
  cancelarConsultaTool,
} from "./tools/scheduleTools";
import { LeadService, TriagemData } from "../services/lead.service";
import { AiConfigService } from "../services/aiConfig.service";
import { ClinicDataService } from "../services/clinicData.service";
import { AppointmentService } from "../services/appointment.service";

const prisma = new PrismaClient();

export class GeminiService {
  private static aiInstance: any = null;

  private static async getClient() {
    if (!this.aiInstance) {
      const { GoogleGenAI } = await (eval('import("@google/genai")') as Promise<{ GoogleGenAI: any }>);
      this.aiInstance = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    }
    return this.aiInstance;
  }

  public static registrarNoHistorico(_remoteJid: string, _userText: string, _modelReply: string) {
    // Histórico agora é persistido diretamente na tabela Message do PostgreSQL
  }

  public static limparHistorico(remoteJid: string) {
    console.log(`🧹 [Sessão Limpa] Contexto reiniciado para ${remoteJid}`);
  }

  private static async callWithRetry(ai: any, params: any, maxRetries = 3): Promise<any> {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent(params);
      } catch (error: any) {
        const isTransient =
          error?.status === 503 ||
          error?.status === 429 ||
          error?.message?.includes("high demand");
        if (isTransient && attempt < maxRetries) {
          console.warn(
            `[GeminiService] Instabilidade transitória (${error.status || "503"}). Tentativa ${attempt} de ${maxRetries} em ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }
  }

  public static async processarMensagem(
    remoteJid: string,
    incomingText: string
  ): Promise<string> {
    const telefoneLimpo = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");

    // 1. Consulta governança e chave mestra de AiConfig
    const aiConfig = await AiConfigService.getConfig();
    if (!aiConfig.iaAtiva) {
      console.log(`🔇 [IA Inativa] Atendimento ignorado para ${telefoneLimpo} pois iaAtiva está desativada.`);
      return "";
    }

    const { pausada, expirada } = await LeadService.verificarEAtualizarSessao(telefoneLimpo);
    if (pausada) {
      return "⚠️ Seu atendimento já foi transferido para nossa equipe de recepção. Um atendente humano responderá em breve!";
    }

    if (expirada) {
      this.limparHistorico(remoteJid);
    }

    try {
      const ai = await this.getClient();

      // 2. Consulta catálogo da clínica (profissionais e serviços)
      const [professionals, services] = await Promise.all([
        ClinicDataService.listProfessionals(),
        ClinicDataService.listServices(),
      ]);

      // 3. Monta dinamicamente a instrução do sistema
      const systemInstruction = buildDynamicSystemPrompt({
        config: aiConfig,
        professionals,
        services,
      });

      // 4. Mapeia e filtra ferramentas ativas segundo as permissões de AiConfig
      const permissoes = (aiConfig.permissoes as Record<string, any>) || {};
      const podeConsultarHorarios = permissoes.consultarHorarios ?? true;
      const podeCriarAgendamentos =
        (permissoes.criarAgendamentos ?? true) && (permissoes.permiteAgendamento ?? true);
      const podeCancelar =
        (permissoes.cancelar ?? true) && (permissoes.permiteCancelamento ?? true);

      const activeTools: any[] = [];
      if (podeCriarAgendamentos) {
        activeTools.push(cadastrarTriagemPacienteTool);
      }
      if (podeConsultarHorarios) {
        activeTools.push(consultarHorariosDisponiveisTool);
      }
      if (podeCancelar) {
        activeTools.push(cancelarConsultaTool);
      }

      const toolsConfig =
        activeTools.length > 0 ? [{ functionDeclarations: activeTools }] : undefined;

      // 5. Recupera histórico do PostgreSQL (últimas 20 mensagens, ordem cronológica)
      const dbMessages = await prisma.message.findMany({
        where: { telefone: telefoneLimpo },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const chronologicalMessages = dbMessages.reverse();

      const contents: any[] = chronologicalMessages.map((msg) => ({
        role: msg.remetente === MessageSender.PACIENTE ? "user" : "model",
        parts: [{ text: msg.texto }],
      }));

      if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
        contents.push({ role: "user", parts: [{ text: incomingText }] });
      }

      // 6. Executa chamada ao Gemini
      const response = await this.callWithRetry(ai, {
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          ...(toolsConfig ? { tools: toolsConfig } : {}),
          temperature: 0.3,
        },
      });

      const functionCalls = response.functionCalls;

      // 7. Loop de execução de Function Calls
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          // --- Tool: Cadastrar Triagem / Pré-Agendamento ---
          if (call.name === "cadastrar_triagem_paciente") {
            if (!podeCriarAgendamentos) {
              return "O agendamento automático pela assistente virtual está desativado no momento. Vou transferir seu atendimento para a recepção! [PAUSAR_IA]";
            }

            const args = call.args as unknown as TriagemData;
            args.telefone = args.telefone || telefoneLimpo;
            await LeadService.salvarTriagem(args);

            const modalidadeTexto =
              args.tipo_atendimento === "CONVENIO" && args.nome_convenio
                ? `pelo convênio ${args.nome_convenio}`
                : "particular";

            const turnoTexto =
              args.periodo_preferencia && args.periodo_preferencia !== "QUALQUER"
                ? ` para o turno da ${args.periodo_preferencia.toLowerCase()}`
                : "";

            return `Perfeito, ${args.nome_completo}! Já registrei sua solicitação para ${args.procedimento} (${modalidadeTexto}${turnoTexto}).\n\nNossa recepção entrará em contato em breve para confirmar o horário exato. Você gostaria de alterar alguma informação ou podemos encerrar por aqui?`;
          }

          // --- Tool: Consultar Horários Disponíveis ---
          if (call.name === "consultar_horarios_disponiveis") {
            if (!podeConsultarHorarios) {
              return "A consulta autônoma de horários está desativada no momento. Por favor, aguarde que a recepção informará as opções disponíveis em instantes!";
            }

            const args = (call.args as any) || {};
            const resultadoHorarios = await AppointmentService.consultarHorariosDisponiveis({
              data: args.data,
              profissional: args.profissional,
              servico: args.servico,
            });

            // Tenta obter resposta humanizada do modelo via FunctionResponse
            if (response.candidates?.[0]?.content) {
              try {
                contents.push(response.candidates[0].content);
                contents.push({
                  role: "tool",
                  parts: [
                    {
                      functionResponse: {
                        name: "consultar_horarios_disponiveis",
                        response: { output: resultadoHorarios },
                      },
                    },
                  ],
                });

                const secondTurn = await this.callWithRetry(ai, {
                  model: "gemini-3.1-flash-lite",
                  contents,
                  config: {
                    systemInstruction,
                    ...(toolsConfig ? { tools: toolsConfig } : {}),
                    temperature: 0.3,
                  },
                });

                if (secondTurn?.text) {
                  return secondTurn.text;
                }
              } catch (followUpError) {
                console.warn("[GeminiService] Falha no second-turn da tool consultar_horarios:", followUpError);
              }
            }

            return resultadoHorarios.mensagem;
          }

          // --- Tool: Cancelar Consulta ---
          if (call.name === "cancelar_consulta") {
            if (!podeCancelar) {
              return "O cancelamento automático pela assistente virtual foi desligado pela clínica. Estou transferindo para nossa recepção atender você e efetuar o cancelamento! [PAUSAR_IA]";
            }

            const args = (call.args as any) || {};
            // Regra 1: se o modelo não fornecer o telefone, usa automaticamente telefoneLimpo da sessão ativa
            const targetPhone = (args.telefone && String(args.telefone).trim().length > 0)
              ? String(args.telefone).replace(/\D/g, "")
              : telefoneLimpo;

            const resultadoCancelamento = await AppointmentService.cancelarConsulta({
              telefone: targetPhone,
              leadId: args.lead_id,
              motivo: args.motivo,
            });

            if (response.candidates?.[0]?.content) {
              try {
                contents.push(response.candidates[0].content);
                contents.push({
                  role: "tool",
                  parts: [
                    {
                      functionResponse: {
                        name: "cancelar_consulta",
                        response: { output: resultadoCancelamento },
                      },
                    },
                  ],
                });

                const secondTurn = await this.callWithRetry(ai, {
                  model: "gemini-3.1-flash-lite",
                  contents,
                  config: {
                    systemInstruction,
                    ...(toolsConfig ? { tools: toolsConfig } : {}),
                    temperature: 0.3,
                  },
                });

                if (secondTurn?.text) {
                  return secondTurn.text;
                }
              } catch (followUpError) {
                console.warn("[GeminiService] Falha no second-turn da tool cancelar_consulta:", followUpError);
              }
            }

            return resultadoCancelamento.message;
          }
        }
      }

      let reply = "";
      try {
        reply = response.text || "";
      } catch {
        reply = "Entendido! Como posso ajudar você?";
      }

      // Trata gatilho de transbordo humano [PAUSAR_IA]
      if (reply.includes("[PAUSAR_IA]")) {
        await LeadService.pausarIA(telefoneLimpo, 60);
        let cleanedReply = reply.replace("[PAUSAR_IA]", "").trim();
        if (!cleanedReply) {
          cleanedReply =
            "Com certeza! Estou pausando meu atendimento e transferindo você para a nossa recepção humana. Em instantes um de nossos atendentes falará com você por aqui! 👩‍💼";
        }
        return cleanedReply;
      }

      // Trata encerramento cordial [ENCERRAR_ATENDIMENTO]
      if (reply.includes("[ENCERRAR_ATENDIMENTO]")) {
        await LeadService.encerrarAtendimento(telefoneLimpo);
        this.limparHistorico(remoteJid);
        return reply.replace("[ENCERRAR_ATENDIMENTO]", "").trim();
      }

      if (!reply) {
        reply = "Entendido! Caso precise de mais algo, estou à disposição.";
      }

      return reply;
    } catch (error) {
      console.error("[GeminiService] Erro ao comunicar com API:", error);
      return "Olá! Tivemos uma oscilação momentânea em nosso sistema de mensagens. Um atendente da clínica falará com você em breve!";
    }
  }
}
