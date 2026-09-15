import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserPlus,
  Loader2,
  X,
} from "lucide-react";
import { api } from "../../services/api";
import type { CustomerItem, CustomerListResponse } from "../../types/customer";

interface CustomersViewProps {
  onOpenDetails?: (telefone: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onOpenDetails }) => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Novo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoProcedimento, setNovoProcedimento] = useState("Avaliação Inicial");
  const [novoTipo, setNovoTipo] = useState<"PARTICULAR" | "CONVENIO">("PARTICULAR");
  const [novoConvenio, setNovoConvenio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const carregarClientes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: CustomerListResponse = await api.getCustomers({
        page,
        limit: 8,
        search: search.trim() || undefined,
      });
      setCustomers(data.customers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoTelefone) return;

    setIsSubmitting(true);
    try {
      await api.createCustomer({
        nomeCompleto: novoNome,
        telefone: novoTelefone,
        procedimento: novoProcedimento,
        tipoAtendimento: novoTipo,
        nomeConvenio: novoTipo === "CONVENIO" ? novoConvenio : null,
      });
      setIsModalOpen(false);
      setNovoNome("");
      setNovoTelefone("");
      await carregarClientes();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRecord = (page - 1) * 8 + 1;
  const endRecord = Math.min(page * 8, total);

  return (
    <div className="space-y-5 transition-all duration-200 ease-in-out">
      {/* Topo: Título & Botão + Novo Cliente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Gestão de Clientes</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Base completa de pacientes, histórico de triagens e consultas clínicas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-500/30 transition-all duration-200 cursor-pointer group shrink-0"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>+ Novo cliente</span>
        </button>
      </div>

      {/* Barra de Busca Universal */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, telefone ou convênio..."
            className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              <span className="text-xs">Carregando prontuários...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              Nenhum cliente encontrado com os critérios de busca.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nome do Paciente</th>
                  <th className="py-3.5 px-4">Telefone</th>
                  <th className="py-3.5 px-4">Procedimento / Modalidade</th>
                  <th className="py-3.5 px-4">Último Atendimento</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Nome com Avatar de Iniciais */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-500 to-sky-400 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                          {c.iniciais}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {c.nomeCompleto}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {c.totalConsultas > 0 ? `${c.totalConsultas} consulta(s)` : "Novo lead"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Telefone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.telefone}</span>
                      </div>
                    </td>

                    {/* Procedimento / Modalidade */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {c.procedimento}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {c.nomeConvenio ? `Convênio: ${c.nomeConvenio}` : "Particular"}
                        </span>
                      </div>
                    </td>

                    {/* Último Atendimento */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {c.ultimoAtendimento || "Sem histórico anterior"}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenDetails && onOpenDetails(c.telefone)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                      >
                        Ver prontuário
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé com Paginação Funcional */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Mostrando {total === 0 ? 0 : `${startRecord}-${endRecord}`} de {total} pacientes
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  page === num
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Novo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Cadastrar Novo Paciente</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Telefone WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="Ex: (89) 99999-8888"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Procedimento de Interesse
                </label>
                <input
                  type="text"
                  value={novoProcedimento}
                  onChange={(e) => setNovoProcedimento(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tipo
                  </label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="PARTICULAR">Particular</option>
                    <option value="CONVENIO">Convênio</option>
                  </select>
                </div>

                {novoTipo === "CONVENIO" && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Operadora
                    </label>
                    <input
                      type="text"
                      value={novoConvenio}
                      onChange={(e) => setNovoConvenio(e.target.value)}
                      placeholder="Ex: Unimed, Bradesco"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  {isSubmitting ? "Salvando..." : "Salvar paciente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
