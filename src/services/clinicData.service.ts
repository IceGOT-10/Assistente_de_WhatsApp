import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DEFAULT_PROFESSIONALS = [
  {
    nome: "Dra. Camila Duarte",
    especialidade: "Clínica Geral e Estética",
    corIdentificador: "#4f46e5",
    ativo: true,
  },
  {
    nome: "Dr. Lucas Ramos",
    especialidade: "Ortodontia e Implantes",
    corIdentificador: "#06b6d4",
    ativo: true,
  },
];

export const DEFAULT_SERVICES = [
  {
    nome: "Limpeza e Profilaxia",
    duracaoMinutos: 45,
    precoBase: 180.0,
    ativo: true,
  },
  {
    nome: "Clareamento Dental",
    duracaoMinutos: 60,
    precoBase: 650.0,
    ativo: true,
  },
  {
    nome: "Avaliação Geral",
    duracaoMinutos: 30,
    precoBase: 120.0,
    ativo: true,
  },
  {
    nome: "Extração de Siso",
    duracaoMinutos: 60,
    precoBase: 350.0,
    ativo: true,
  },
];

export class ClinicDataService {
  /**
   * Garante a inicialização de profissionais e serviços padrão se as tabelas estiverem vazias.
   */
  public static async ensureSeed() {
    const profCount = await prisma.professional.count();
    if (profCount === 0) {
      for (const prof of DEFAULT_PROFESSIONALS) {
        await prisma.professional.upsert({
          where: { nome: prof.nome },
          update: {},
          create: prof,
        });
      }
      console.log("👨‍⚕️ [Seed] Profissionais padrão inicializados.");
    }

    const srvCount = await prisma.service.count();
    if (srvCount === 0) {
      for (const srv of DEFAULT_SERVICES) {
        await prisma.service.upsert({
          where: { nome: srv.nome },
          update: {},
          create: srv,
        });
      }
      console.log("🦷 [Seed] Serviços padrão inicializados.");
    }
  }

  public static async listProfessionals() {
    await this.ensureSeed();
    return await prisma.professional.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
  }

  public static async listServices() {
    await this.ensureSeed();
    return await prisma.service.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
  }
}

