-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('PARTICULAR', 'CONVENIO');

-- CreateEnum
CREATE TYPE "TurnoPreferencia" AS ENUM ('MANHA', 'TARDE', 'QUALQUER');

-- CreateEnum
CREATE TYPE "StatusLead" AS ENUM ('NOVO', 'AGUARDANDO_CONFIRMACAO', 'AGENDADO', 'TRANSBORDO_HUMANO');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "procedimento" TEXT NOT NULL,
    "tipoAtendimento" "TipoAtendimento" NOT NULL,
    "nomeConvenio" TEXT,
    "periodoPreferencia" "TurnoPreferencia" DEFAULT 'QUALQUER',
    "status" "StatusLead" NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionControl" (
    "id" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "iaPausada" BOOLEAN NOT NULL DEFAULT false,
    "pausadaAte" TIMESTAMP(3),
    "ultimaInteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionControl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_telefone_key" ON "Lead"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "SessionControl_telefone_key" ON "SessionControl"("telefone");
