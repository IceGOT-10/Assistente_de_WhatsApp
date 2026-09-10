import dotenv from "dotenv";

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
}

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "3000"), 10),
  DATABASE_URL: getEnv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/whatsapp_triage_db?schema=public"),
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY", ""),
  CLINIC_NAME: getEnv("CLINIC_NAME", "Clínica OdontoPrime"),
  BUFFER_DEBOUNCE_MS: parseInt(getEnv("BUFFER_DEBOUNCE_MS", "5000"), 10),
};
