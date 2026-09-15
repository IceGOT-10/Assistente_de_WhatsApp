-- AlterTable
ALTER TABLE "SessionControl" ADD COLUMN IF NOT EXISTS "atendimentoAtivo" BOOLEAN NOT NULL DEFAULT true;

-- CreateEnum
CREATE TYPE "StatusAppointment" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('PACIENTE', 'IA', 'ATENDENTE');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "observacoes" TEXT;

-- AlterTable
ALTER TABLE "SessionControl" ADD COLUMN "remoteJid" TEXT;

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "profissional" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "status" "StatusAppointment" NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "leadId" TEXT,
    "texto" TEXT NOT NULL,
    "remetente" "MessageSender" NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "iaAtiva" BOOLEAN NOT NULL DEFAULT true,
    "nomeAssistente" TEXT NOT NULL DEFAULT 'Sofia',
    "mensagemInicial" TEXT NOT NULL,
    "permissoes" JSONB NOT NULL,
    "gatilhosTransbordo" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiActionLog" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "detalhes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_data_idx" ON "Appointment"("data");

-- CreateIndex
CREATE INDEX "Appointment_profissional_idx" ON "Appointment"("profissional");

-- CreateIndex
CREATE INDEX "Message_telefone_idx" ON "Message"("telefone");

-- CreateIndex
CREATE INDEX "Message_remoteJid_idx" ON "Message"("remoteJid");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "AiActionLog_createdAt_idx" ON "AiActionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

