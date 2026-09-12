import { useEffect, useState, useMemo, useCallback } from "react";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { KanbanBoard } from "./components/KanbanBoard";
import { LeadDetailsModal } from "./components/LeadDetailsModal";
import { ToastContainer } from "./components/Toast";
import { api } from "./services/api";
import type {
  Lead,
  LeadStatus,
  TipoAtendimento,
  DashboardStats,
  ToastMessage,
} from "./types/lead";
import { Loader2, SearchX } from "lucide-react";

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<"ALL" | TipoAtendimento>("ALL");

  // Modal & Toasts
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const carregarLeads = useCallback(
    async (manual: boolean = false) => {
      if (manual) setIsRefreshing(true);
      try {
        const dados = await api.getLeads();
        setLeads(dados);
        setLastUpdated(new Date());
        if (manual) {
          addToast({
            type: "success",
            title: "Dados atualizados",
            message: "Fila de triagem sincronizada com sucesso.",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar leads:", err);
        if (manual) {
          addToast({
            type: "error",
            title: "Falha de conexão",
            message: "Não foi possível sincronizar com o servidor.",
          });
        }
      } finally {
        setLoading(false);
        if (manual) setIsRefreshing(false);
      }
    },
    [addToast]
  );

  const moverStatus = async (id: string, novoStatus: LeadStatus) => {
    const leadAnterior = leads.find((l) => l.id === id);
    if (!leadAnterior || leadAnterior.status === novoStatus) return;

    try {
      setUpdatingId(id);
      // Atualização otimista
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l))
      );

      // Se o modal estiver aberto para esse lead, atualiza ele também
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead((prev) =>
          prev ? { ...prev, status: novoStatus } : null
        );
      }

      await api.updateLeadStatus(id, novoStatus);

      addToast({
        type: "success",
        title: "Etapa atualizada",
        message: `${leadAnterior.nomeCompleto} movido para ${getStatusLabel(
          novoStatus
        )}.`,
      });
    } catch (err) {
      console.error("Falha ao atualizar status:", err);
      addToast({
        type: "error",
        title: "Erro ao mover lead",
        message: "Ocorreu uma falha na atualização. Revertendo alteração.",
      });
      carregarLeads();
    } finally {
      setUpdatingId(null);
    }
  };

  const resetarSessao = async (telefone: string) => {
    try {
      const res = await api.resetSession(telefone);
      addToast({
        type: "success",
        title: "Sessão reiniciada",
        message: res.message || "A pausa e a IA foram liberadas no WhatsApp.",
      });
    } catch (err) {
      console.error("Erro ao resetar atendimento:", err);
      addToast({
        type: "error",
        title: "Falha no reset",
        message: "Não foi possível reiniciar o atendimento.",
      });
    }
  };

  const abrirDetalhes = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const fecharDetalhes = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  // Polling automático a cada 8 segundos
  useEffect(() => {
    let ativo = true;

    const sincronizar = async () => {
      try {
        const dados = await api.getLeads();
        if (ativo) {
          setLeads(dados);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Erro ao sincronizar leads:", err);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    sincronizar();
    const intervalo = setInterval(sincronizar, 8000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, []);

  // Cálculo de Métricas e Estatísticas
  const stats: DashboardStats = useMemo(() => {
    const totalLeads = leads.length;
    const aguardandoConfirmacao = leads.filter(
      (l) => l.status === "AGUARDANDO_CONFIRMACAO"
    ).length;
    const agendados = leads.filter((l) => l.status === "AGENDADO").length;
    const novosLeads = leads.filter((l) => l.status === "NOVO").length;
    const transbordoHumano = leads.filter(
      (l) => l.status === "TRANSBORDO_HUMANO"
    ).length;
    const taxaConversao =
      totalLeads > 0 ? (agendados / totalLeads) * 100 : 0;

    return {
      totalLeads,
      aguardandoConfirmacao,
      agendados,
      taxaConversao,
      novosLeads,
      transbordoHumano,
    };
  }, [leads]);

  // Filtros de busca e tipo de atendimento
  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      // Filtro por tipo de atendimento
      if (tipoFilter !== "ALL" && lead.tipoAtendimento !== tipoFilter) {
        return false;
      }

      // Filtro por busca textual
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const nome = lead.nomeCompleto.toLowerCase();
        const tel = lead.telefone.replace(/\D/g, "");
        const proc = lead.procedimento.toLowerCase();
        const conv = (lead.nomeConvenio || "").toLowerCase();

        return (
          nome.includes(term) ||
          tel.includes(term.replace(/\D/g, "")) ||
          proc.includes(term) ||
          conv.includes(term)
        );
      }

      return true;
    });
  }, [leads, searchTerm, tipoFilter]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Corporativo */}
      <Header
        onRefresh={() => carregarLeads(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        tipoFilter={tipoFilter}
        onTipoFilterChange={setTipoFilter}
        totalLeads={leads.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* KPI / Stats Cards */}
        <StatsCards stats={stats} />

        {/* Loading State Inicial */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-600">
              Carregando painel de triagem da clínica...
            </span>
          </div>
        ) : leadsFiltrados.length === 0 && searchTerm ? (
          /* Estado de Busca Sem Resultados */
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <SearchX className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhum paciente encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              Não encontramos nenhum lead correspondente à busca "{searchTerm}".
              Tente pesquisar por outro nome, telefone ou procedimento.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          /* Kanban Board */
          <KanbanBoard
            leads={leadsFiltrados}
            onUpdateStatus={moverStatus}
            onResetSession={resetarSessao}
            onOpenDetails={abrirDetalhes}
            updatingId={updatingId}
          />
        )}
      </main>

      {/* Modal de Detalhes do Lead */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={fecharDetalhes}
        onUpdateStatus={moverStatus}
        onResetSession={resetarSessao}
        isUpdating={Boolean(updatingId && updatingId === selectedLead?.id)}
      />

      {/* Sistema de Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function getStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "NOVO":
      return "Novos Leads";
    case "AGUARDANDO_CONFIRMACAO":
      return "Aguardando Confirmação";
    case "AGENDADO":
      return "Agendados";
    case "TRANSBORDO_HUMANO":
      return "Transbordo Humano";
  }
}
