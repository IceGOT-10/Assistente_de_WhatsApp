import { useEffect, useState, useMemo, useCallback } from "react";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { KanbanBoard } from "./components/KanbanBoard";
import { ClinicCalendar } from "./components/ClinicCalendar";
import { LeadDetailsModal } from "./components/LeadDetailsModal";
import { ScheduleModal } from "./components/ScheduleModal";
import { ToastContainer } from "./components/Toast";
import { useTheme } from "./hooks/useTheme";
import { api } from "./services/api";
import type {
  Lead,
  LeadStatus,
  TipoAtendimento,
  DashboardStats,
  ToastMessage,
  ViewMode,
  UpdateLeadDTO,
} from "./types/lead";
import { Loader2, SearchX } from "lucide-react";

const LOCAL_STORAGE_LEADS_KEY = "odontoprime_leads_ext";

function getStoredLeadsExt(): Record<string, Partial<Lead>> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveStoredLeadExt(id: string, ext: Partial<Lead>) {
  try {
    const current = getStoredLeadsExt();
    current[id] = { ...(current[id] || {}), ...ext };
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Erro ao salvar dados estendidos do lead no cache:", e);
  }
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<"ALL" | TipoAtendimento>("ALL");

  // Modal de Detalhes & Agendamento & Toasts
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [leadToSchedule, setLeadToSchedule] = useState<Lead | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
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

  // Carrega leads da API mesclando com o cache local para campos adicionais (observações, agendamentos)
  const mergeLeadsWithExt = (serverLeads: Lead[]): Lead[] => {
    const ext = getStoredLeadsExt();
    return serverLeads.map((l) => {
      const stored = ext[l.id];
      if (stored) {
        return {
          ...l,
          observacoes: stored.observacoes ?? l.observacoes,
          dataAgendamento: stored.dataAgendamento ?? l.dataAgendamento,
          horarioAgendado: stored.horarioAgendado ?? l.horarioAgendado,
        };
      }
      return l;
    });
  };

  const carregarLeads = useCallback(
    async (manual: boolean = false) => {
      if (manual) setIsRefreshing(true);
      try {
        const dados = await api.getLeads();
        const merged = mergeLeadsWithExt(dados);
        setLeads(merged);
        setLastUpdated(new Date());
        if (manual) {
          addToast({
            type: "success",
            title: "Dados sincronizados",
            message: "Fila de triagem e agenda atualizadas com sucesso.",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar leads:", err);
        if (manual) {
          addToast({
            type: "error",
            title: "Falha de conexão",
            message: "Não foi possível sincronizar com o servidor da clínica.",
          });
        }
      } finally {
        setLoading(false);
        if (manual) setIsRefreshing(false);
      }
    },
    [addToast]
  );

  // Mover etapa do lead
  const moverStatus = async (id: string, novoStatus: LeadStatus) => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo || leadAlvo.status === novoStatus) return;

    // Se estiver movendo para AGENDADO e não tiver data/hora, abre o modal de agendamento
    if (novoStatus === "AGENDADO" && !leadAlvo.dataAgendamento) {
      setLeadToSchedule(leadAlvo);
      setIsScheduleModalOpen(true);
      return;
    }

    try {
      setUpdatingId(id);
      // Atualização otimista
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l))
      );

      if (selectedLead && selectedLead.id === id) {
        setSelectedLead((prev) =>
          prev ? { ...prev, status: novoStatus } : null
        );
      }

      await api.updateLeadStatus(id, novoStatus);

      addToast({
        type: "success",
        title: "Etapa atualizada",
        message: `${leadAlvo.nomeCompleto} movido para ${getStatusLabel(
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

  // Salvar edições do lead
  const salvarLead = async (id: string, data: UpdateLeadDTO) => {
    try {
      setUpdatingId(id);

      // Persiste campos extras em cache local
      saveStoredLeadExt(id, {
        observacoes: data.observacoes,
        dataAgendamento: data.dataAgendamento,
        horarioAgendado: data.horarioAgendado,
      });

      // Atualização otimista
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                ...data,
                nomeCompleto: data.nomeCompleto ?? l.nomeCompleto,
                telefone: data.telefone ?? l.telefone,
                procedimento: data.procedimento ?? l.procedimento,
                tipoAtendimento: data.tipoAtendimento ?? l.tipoAtendimento,
                nomeConvenio: data.nomeConvenio !== undefined ? data.nomeConvenio : l.nomeConvenio,
                periodoPreferencia: data.periodoPreferencia !== undefined ? data.periodoPreferencia : l.periodoPreferencia,
                observacoes: data.observacoes !== undefined ? data.observacoes : l.observacoes,
                dataAgendamento: data.dataAgendamento !== undefined ? data.dataAgendamento : l.dataAgendamento,
                horarioAgendado: data.horarioAgendado !== undefined ? data.horarioAgendado : l.horarioAgendado,
              }
            : l
        )
      );

      if (selectedLead && selectedLead.id === id) {
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                ...data,
                nomeCompleto: data.nomeCompleto ?? prev.nomeCompleto,
                telefone: data.telefone ?? prev.telefone,
                procedimento: data.procedimento ?? prev.procedimento,
                tipoAtendimento: data.tipoAtendimento ?? prev.tipoAtendimento,
                nomeConvenio: data.nomeConvenio !== undefined ? data.nomeConvenio : prev.nomeConvenio,
                periodoPreferencia: data.periodoPreferencia !== undefined ? data.periodoPreferencia : prev.periodoPreferencia,
                observacoes: data.observacoes !== undefined ? data.observacoes : prev.observacoes,
                dataAgendamento: data.dataAgendamento !== undefined ? data.dataAgendamento : prev.dataAgendamento,
                horarioAgendado: data.horarioAgendado !== undefined ? data.horarioAgendado : prev.horarioAgendado,
              }
            : null
        );
      }

      // Chamada à API
      await api.updateLead(id, data);

      addToast({
        type: "success",
        title: "Cadastro atualizado",
        message: "As informações do paciente foram salvas com sucesso.",
      });
    } catch (err) {
      console.error("Erro ao salvar lead:", err);
      addToast({
        type: "error",
        title: "Erro ao salvar",
        message: "Não foi possível salvar as alterações no servidor.",
      });
      throw err;
    } finally {
      setUpdatingId(null);
    }
  };

  // Confirmar agendamento de data e horário
  const confirmarAgendamento = async (
    leadId: string,
    dataAgendamento: string,
    horarioAgendado: string,
    observacoes?: string
  ) => {
    try {
      setUpdatingId(leadId);

      // Salva no cache
      saveStoredLeadExt(leadId, {
        dataAgendamento,
        horarioAgendado,
        observacoes,
      });

      // Atualiza localmente
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: "AGENDADO",
                dataAgendamento,
                horarioAgendado,
                observacoes: observacoes ?? l.observacoes,
              }
            : l
        )
      );

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                status: "AGENDADO",
                dataAgendamento,
                horarioAgendado,
                observacoes: observacoes ?? prev.observacoes,
              }
            : null
        );
      }

      // Envia atualização para a API
      await api.updateLead(leadId, {
        dataAgendamento,
        horarioAgendado,
        observacoes,
      });
      await api.updateLeadStatus(leadId, "AGENDADO");

      addToast({
        type: "success",
        title: "Consulta Agendada",
        message: `Agendamento marcado para ${dataAgendamento} às ${horarioAgendado}.`,
      });
    } catch (err) {
      console.error("Erro ao agendar consulta:", err);
      addToast({
        type: "error",
        title: "Erro no agendamento",
        message: "Ocorreu um erro ao salvar o horário do agendamento.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Reset de sessão
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

  const abrirAgendamento = (lead: Lead) => {
    setLeadToSchedule(lead);
    setIsScheduleModalOpen(true);
  };

  const fecharAgendamento = () => {
    setIsScheduleModalOpen(false);
    setLeadToSchedule(null);
  };

  // Polling automático a cada 8 segundos
  useEffect(() => {
    let ativo = true;

    const sincronizar = async () => {
      try {
        const dados = await api.getLeads();
        if (ativo) {
          const merged = mergeLeadsWithExt(dados);
          setLeads(merged);
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
        const nome = (lead.nomeCompleto || "").toLowerCase();
        const tel = (lead.telefone || "").replace(/\D/g, "");
        const proc = (lead.procedimento || "").toLowerCase();
        const conv = (lead.nomeConvenio || "").toLowerCase();
        const obs = (lead.observacoes || "").toLowerCase();

        return (
          nome.includes(term) ||
          tel.includes(term.replace(/\D/g, "")) ||
          proc.includes(term) ||
          conv.includes(term) ||
          obs.includes(term)
        );
      }

      return true;
    });
  }, [leads, searchTerm, tipoFilter]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Header Corporativo com Alternador de Visualização e Tema */}
      <Header
        onRefresh={() => carregarLeads(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        tipoFilter={tipoFilter}
        onTipoFilterChange={setTipoFilter}
        totalLeads={leads.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* KPI / Stats Cards */}
        <StatsCards stats={stats} />

        {/* Loading State Inicial */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Carregando painel de triagem da clínica...
            </span>
          </div>
        ) : leadsFiltrados.length === 0 && searchTerm ? (
          /* Estado de Busca Sem Resultados */
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <SearchX className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Nenhum paciente encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-4">
              Não encontramos nenhum lead correspondente à busca "{searchTerm}".
              Tente pesquisar por outro nome, telefone ou procedimento.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        ) : viewMode === "kanban" ? (
          /* Visão Kanban */
          <KanbanBoard
            leads={leadsFiltrados}
            onUpdateStatus={moverStatus}
            onResetSession={resetarSessao}
            onOpenDetails={abrirDetalhes}
            updatingId={updatingId}
          />
        ) : (
          /* Visão Calendário da Clínica */
          <ClinicCalendar
            leads={leadsFiltrados}
            onOpenDetails={abrirDetalhes}
            onOpenScheduleModal={abrirAgendamento}
          />
        )}
      </main>

      {/* Modal de Detalhes do Lead (Edição Completa) */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={fecharDetalhes}
        onUpdateStatus={moverStatus}
        onResetSession={resetarSessao}
        onSaveLead={salvarLead}
        isUpdating={Boolean(updatingId && updatingId === selectedLead?.id)}
      />

      {/* Modal de Agendamento Rápido de Data/Horário */}
      <ScheduleModal
        lead={leadToSchedule}
        isOpen={isScheduleModalOpen}
        onClose={fecharAgendamento}
        onConfirmSchedule={confirmarAgendamento}
        isSaving={Boolean(updatingId && updatingId === leadToSchedule?.id)}
      />

      {/* Sistema de Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function getStatusLabel(status: LeadStatus): string {
  switch (status) {
    case "NOVO":
      return "Pré-Agendamentos";
    case "AGUARDANDO_CONFIRMACAO":
      return "Em Negociação";
    case "AGENDADO":
      return "Consultas Agendadas";
    case "TRANSBORDO_HUMANO":
      return "Atenção da Recepção";
  }
}
