import { PrismaClient } from "@prisma/client";
import { ENV } from "../config/env";

const prisma = new PrismaClient();

export const DEFAULT_AI_PERMISSIONS = {
  consultarHorarios: true,
  criarAgendamentos: true,
  reagendar: true,
  cancelar: true,
  confirmarAtendimento: true,
  responderDuvidas: true,
};

export const DEFAULT_AI_TRIGGERS = {
  pedirHumano: true,
  reclamacao: true,
  situacaoNaoIdentificada: true,
};

export class AiConfigService {
  public static async ensureDefaultConfig() {
    return await prisma.aiConfig.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        iaAtiva: true,
        nomeAssistente: "Sofia",
        mensagemInicial: `Olá! Sou a Sofia, assistente virtual da ${ENV.CLINIC_NAME}. Como posso te ajudar hoje?`,
        permissoes: DEFAULT_AI_PERMISSIONS,
        gatilhosTransbordo: DEFAULT_AI_TRIGGERS,
      },
    });
  }

  public static async getConfig() {
    let config = await prisma.aiConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await this.ensureDefaultConfig();
    }

    return config;
  }

  public static async updateConfig(data: {
    iaAtiva?: boolean;
    nomeAssistente?: string;
    mensagemInicial?: string;
    permissoes?: any;
    gatilhosTransbordo?: any;
  }) {
    return await prisma.aiConfig.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        iaAtiva: data.iaAtiva ?? true,
        nomeAssistente: data.nomeAssistente ?? "Sofia",
        mensagemInicial:
          data.mensagemInicial ??
          `Olá! Sou a Sofia, assistente virtual da ${ENV.CLINIC_NAME}. Como posso te ajudar hoje?`,
        permissoes: data.permissoes ?? DEFAULT_AI_PERMISSIONS,
        gatilhosTransbordo: data.gatilhosTransbordo ?? DEFAULT_AI_TRIGGERS,
      },
    });
  }
}

