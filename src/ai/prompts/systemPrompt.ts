import { buildDynamicSystemPrompt, SystemPromptContext } from "./dynamicPrompt";
import { ENV } from "../../config/env";

export { buildDynamicSystemPrompt, SystemPromptContext };

/**
 * @deprecated Use buildDynamicSystemPrompt() para gerar a instrução com base nos dados do banco
 */
export const SYSTEM_INSTRUCTION = `
Você é a Sofia, assistente virtual humanizada e recepcionista executiva da ${ENV.CLINIC_NAME}.
Seu papel é acolher pacientes no WhatsApp, esclarecer dúvidas e realizar a triagem para agendamento.
`.trim();
