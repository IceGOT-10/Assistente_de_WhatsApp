import { PrismaClient, TipoAtendimento, TurnoPreferencia, StatusLead } from "@prisma/client";

const prisma = new PrismaClient();

export interface TriagemData {
  nome_completo: string;
  telefone: string;
  procedimento: string;
  tipo_atendimento: "PARTICULAR" | "CONVENIO";
  nome_convenio?: string;
  periodo_preferencia?: "MANHA" | "TARDE" | "QUALQUER";
}

export class LeadService {
  private static readonly TIMEOUT_INATIVIDADE_MINUTOS = 15;

  public static async salvarTriagem(dados: TriagemData) {
    const tipo = dados.tipo_atendimento === "CONVENIO"
      ? TipoAtendimento.CONVENIO
      : TipoAtendimento.PARTICULAR;

    let turno: TurnoPreferencia = TurnoPreferencia.QUALQUER;
    if (dados.periodo_preferencia === "MANHA") turno = TurnoPreferencia.MANHA;
    if (dados.periodo_preferencia === "TARDE") turno = TurnoPreferencia.TARDE;

    return await prisma.lead.upsert({
      where: { telefone: dados.telefone },
      update: {
        nomeCompleto: dados.nome_completo,
        procedimento: dados.procedimento,
        tipoAtendimento: tipo,
        nomeConvenio: dados.nome_convenio || null,
        periodoPreferencia: turno,
        status: StatusLead.NOVO,
      },
      create: {
        nomeCompleto: dados.nome_completo,
        telefone: dados.telefone,
        procedimento: dados.procedimento,
        tipoAtendimento: tipo,
        nomeConvenio: dados.nome_convenio || null,
        periodoPreferencia: turno,
        status: StatusLead.NOVO,
      },
    });
  }

  public static async isIaPausada(telefone: string): Promise<boolean> {
    const session = await prisma.sessionControl.findUnique({
      where: { telefone },
    });

    if (!session || !session.iaPausada) return false;

    if (session.pausadaAte && new Date() > session.pausadaAte) {
      await prisma.sessionControl.update({
        where: { telefone },
        data: { iaPausada: false, pausadaAte: null },
      });
      return false;
    }

    return true;
  }

  public static async verificarEAtualizarSessao(telefone: string): Promise<{ pausada: boolean; expirada: boolean }> {
    const session = await prisma.sessionControl.findUnique({
      where: { telefone },
    });

    if (!session) {
      await prisma.sessionControl.create({
        data: { telefone, atendimentoAtivo: true, ultimaInteracao: new Date() },
      });
      return { pausada: false, expirada: false };
    }

    if (session.iaPausada) {
      if (session.pausadaAte && new Date() > session.pausadaAte) {
        await prisma.sessionControl.update({
          where: { telefone },
          data: { iaPausada: false, pausadaAte: null },
        });
      } else {
        return { pausada: true, expirada: false };
      }
    }

    const agora = new Date().getTime();
    const ultima = new Date(session.ultimaInteracao).getTime();
    const minutosSemInteracao = (agora - ultima) / (1000 * 60);
    const expirada = !session.atendimentoAtivo || minutosSemInteracao > this.TIMEOUT_INATIVIDADE_MINUTOS;

    await prisma.sessionControl.update({
      where: { telefone },
      data: {
        atendimentoAtivo: true,
        ultimaInteracao: new Date(),
      },
    });

    return { pausada: false, expirada };
  }

  public static async encerrarAtendimento(telefone: string) {
    return await prisma.sessionControl.upsert({
      where: { telefone },
      update: {
        atendimentoAtivo: false,
        iaPausada: false,
        pausadaAte: null,
        ultimaInteracao: new Date(),
      },
      create: {
        telefone,
        atendimentoAtivo: false,
        iaPausada: false,
        pausadaAte: null,
        ultimaInteracao: new Date(),
      },
    });
  }

  /**
   * Pausa o atendimento da IA para o contato.
   * Se 'minutos' for null, a pausa é INDEFINIDA (intervenção manual firme) até que a recepção
   * retome explicitamente o atendimento para a IA.
   */
  public static async pausarIA(telefone: string, minutos: number | null = null) {
    const pausadaAte = minutos ? new Date(Date.now() + minutos * 60 * 1000) : null;
    return await prisma.sessionControl.upsert({
      where: { telefone },
      update: { iaPausada: true, pausadaAte, ultimaInteracao: new Date() },
      create: { telefone, iaPausada: true, pausadaAte, ultimaInteracao: new Date() },
    });
  }

  /**
   * Retoma o atendimento da assistente virtual IA, limpando a pausa manual da sessão.
   */
  public static async retomarIA(telefone: string) {
    return await prisma.sessionControl.upsert({
      where: { telefone },
      update: {
        iaPausada: false,
        pausadaAte: null,
        atendimentoAtivo: true,
        ultimaInteracao: new Date(),
      },
      create: {
        telefone,
        iaPausada: false,
        pausadaAte: null,
        atendimentoAtivo: true,
        ultimaInteracao: new Date(),
      },
    });
  }

  public static async listarLeads() {
    return await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
