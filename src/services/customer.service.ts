import { PrismaClient, TipoAtendimento, TurnoPreferencia, StatusLead } from "@prisma/client";

const prisma = new PrismaClient();

export interface CustomerQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateCustomerDTO {
  nomeCompleto: string;
  telefone: string;
  procedimento: string;
  tipoAtendimento?: "PARTICULAR" | "CONVENIO";
  nomeConvenio?: string | null;
  periodoPreferencia?: "MANHA" | "TARDE" | "QUALQUER" | null;
  observacoes?: string | null;
}

export interface UpdateCustomerDTO {
  nomeCompleto?: string;
  telefone?: string;
  procedimento?: string;
  tipoAtendimento?: "PARTICULAR" | "CONVENIO";
  nomeConvenio?: string | null;
  periodoPreferencia?: "MANHA" | "TARDE" | "QUALQUER" | null;
  observacoes?: string | null;
  status?: StatusLead;
}

export class CustomerService {
  /**
   * Retorna lista paginada de clientes com busca textual e contagem total.
   */
  public static async listCustomers(options: CustomerQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(options.limit) || 8));
    const skip = (page - 1) * limit;
    const search = options.search?.trim();

    const where: any = {};
    if (search) {
      const cleanPhone = search.replace(/\D/g, "");
      where.OR = [
        { nomeCompleto: { contains: search, mode: "insensitive" } },
        { procedimento: { contains: search, mode: "insensitive" } },
        { nomeConvenio: { contains: search, mode: "insensitive" } },
        ...(cleanPhone ? [{ telefone: { contains: cleanPhone } }] : []),
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          appointments: {
            orderBy: { data: "desc" },
            take: 3,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const customers = leads.map((lead) => {
      const initials = lead.nomeCompleto
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();

      return {
        id: lead.id,
        nomeCompleto: lead.nomeCompleto,
        iniciais: initials || "CL",
        telefone: lead.telefone,
        procedimento: lead.procedimento,
        tipoAtendimento: lead.tipoAtendimento,
        nomeConvenio: lead.nomeConvenio,
        status: lead.status,
        observacoes: lead.observacoes,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        totalConsultas: lead.appointments.length,
        ultimoAtendimento: lead.appointments[0]
          ? `${lead.appointments[0].data.toISOString().split("T")[0]} às ${lead.appointments[0].horarioInicio}`
          : null,
      };
    });

    return {
      customers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Criação manual de um cliente pela recepção.
   */
  public static async createCustomer(dto: CreateCustomerDTO) {
    const cleanTelefone = dto.telefone.replace(/\D/g, "");

    const tipo = dto.tipoAtendimento === "CONVENIO" ? TipoAtendimento.CONVENIO : TipoAtendimento.PARTICULAR;

    let turno: TurnoPreferencia = TurnoPreferencia.QUALQUER;
    if (dto.periodoPreferencia === "MANHA") turno = TurnoPreferencia.MANHA;
    if (dto.periodoPreferencia === "TARDE") turno = TurnoPreferencia.TARDE;

    return await prisma.lead.upsert({
      where: { telefone: cleanTelefone },
      update: {
        nomeCompleto: dto.nomeCompleto,
        procedimento: dto.procedimento,
        tipoAtendimento: tipo,
        nomeConvenio: dto.nomeConvenio || null,
        periodoPreferencia: turno,
        observacoes: dto.observacoes ?? undefined,
      },
      create: {
        nomeCompleto: dto.nomeCompleto,
        telefone: cleanTelefone,
        procedimento: dto.procedimento,
        tipoAtendimento: tipo,
        nomeConvenio: dto.nomeConvenio || null,
        periodoPreferencia: turno,
        status: StatusLead.NOVO,
        observacoes: dto.observacoes || null,
      },
    });
  }

  /**
   * Atualização cadastral e anotações clínicas do cliente.
   */
  public static async updateCustomer(id: string, dto: UpdateCustomerDTO) {
    const dataToUpdate: any = {};

    if (dto.nomeCompleto) dataToUpdate.nomeCompleto = dto.nomeCompleto;
    if (dto.telefone) dataToUpdate.telefone = dto.telefone.replace(/\D/g, "");
    if (dto.procedimento) dataToUpdate.procedimento = dto.procedimento;
    if (dto.tipoAtendimento) dataToUpdate.tipoAtendimento = dto.tipoAtendimento;
    if (dto.nomeConvenio !== undefined) dataToUpdate.nomeConvenio = dto.nomeConvenio;
    if (dto.observacoes !== undefined) dataToUpdate.observacoes = dto.observacoes;
    if (dto.status) dataToUpdate.status = dto.status;
    if (dto.periodoPreferencia) dataToUpdate.periodoPreferencia = dto.periodoPreferencia;

    return await prisma.lead.update({
      where: { id },
      data: dataToUpdate,
    });
  }
}

