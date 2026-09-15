import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { LeadDetailsModal } from "./components/LeadDetailsModal";
import { ScheduleModal } from "./components/ScheduleModal";
import { ToastContainer } from "./components/Toast";
import { useTheme } from "./hooks/useTheme";
import { useNavigation } from "./hooks/useNavigation";
import { api } from "./services/api";
import type {
  Lead,
  LeadStatus,
  ToastMessage,
  UpdateLeadDTO,
} from "./types/lead";
import { DashboardView } from "./components/dashboard/DashboardView";
import { CalendarView } from "./components/calendar/CalendarView";
import { ChatView } from "./components/chat/ChatView";
import { CustomersView } from "./components/customers/CustomersView";
import { AiSettingsView } from "./components/ai-settings/AiSettingsView";
import { LoginView } from "./components/auth/LoginView";
import { ReportsView } from "./components/reports/ReportsView";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { activeTab, setActiveTab } = useNavigation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modais de Detalhes & Agendamento & Notificações Toasts
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

  const carregarLeads = useCallback(async () => {
    try {
      const dados = await api.getLeads();
      setLeads(dados);
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      carregarLeads();
    }
  }, [carregarLeads, isAuthenticated]);

  // Abertura de prontuário por telefone (acionado pelo chat ou tela de clientes)
  const abrirDetalhesPorTelefone = (telefone: string) => {
    const clean = telefone.replace(/\D/g, "");
    const found = leads.find(
      (l) =>
        l.telefone.replace(/\D/g, "").includes(clean) ||
        clean.includes(l.telefone.replace(/\D/g, ""))
    );
    if (found) {
      setSelectedLead(found);
      setIsModalOpen(true);
    } else {
      api.getLeads().then((allLeads) => {
        setLeads(allLeads);
        const matching = allLeads.find(
          (l) =>
            l.telefone.replace(/\D/g, "").includes(clean) ||
            clean.includes(l.telefone.replace(/\D/g, ""))
        );
        if (matching) {
          setSelectedLead(matching);
          setIsModalOpen(true);
        }
      });
    }
  };

  const moverStatus = async (id: string, novoStatus: LeadStatus) => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo || leadAlvo.status === novoStatus) return;

    if (novoStatus === "AGENDADO" && !leadAlvo.dataAgendamento) {
      setLeadToSchedule(leadAlvo);
      setIsScheduleModalOpen(true);
      return;
    }

    try {
      setUpdatingId(id);
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l))
      );

      if (selectedLead && selectedLead.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, status: novoStatus } : null));
      }

      await api.updateLeadStatus(id, novoStatus);

      addToast({
        type: "success",
        title: "Status atualizado",
        message: `${leadAlvo.nomeCompleto} atualizado com sucesso.`,
      });
    } catch (err) {
      console.error("Erro ao mover status:", err);
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: leadAlvo.status } : l))
      );
      addToast({
        type: "error",
        title: "Erro na atualização",
        message: "Não foi possível sincronizar a alteração.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const resetarSessao = async (id: string) => {
    const leadAlvo = leads.find((l) => l.id === id);
    if (!leadAlvo) return;

    try {
      setUpdatingId(id);
      await api.resetSession(id);
      await carregarLeads();

      addToast({
        type: "info",
        title: "Sessão reiniciada",
        message: `A assistente Sofia reassumiu o contato de ${leadAlvo.nomeCompleto}.`,
      });
    } catch (err) {
      console.error("Erro ao resetar sessão:", err);
      addToast({
        type: "error",
        title: "Erro ao resetar",
        message: "Não foi possível reativar a IA para este paciente.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const salvarLead = async (id: string, dto: UpdateLeadDTO) => {
    try {
      setUpdatingId(id);
      const atualizado = await api.updateLead(id, dto);

      // Se informou data e horário de agendamento na edição do lead, cria consulta persistente no Appointment
      if (dto.dataAgendamento && dto.horarioAgendado) {
        await api.createAppointment({
          leadId: id,
          nomeCompleto: dto.nomeCompleto || atualizado.nomeCompleto,
          telefone: dto.telefone || atualizado.telefone,
          procedimento: dto.procedimento || atualizado.procedimento,
          tipoAtendimento: dto.tipoAtendimento || atualizado.tipoAtendimento,
          nomeConvenio: dto.nomeConvenio,
          data: dto.dataAgendamento,
          horarioInicio: dto.horarioAgendado,
          profissional: "Dra. Camila Duarte",
          observacoes: dto.observacoes,
        });
      }

      await carregarLeads();
      setSelectedLead(atualizado);

      addToast({
        type: "success",
        title: "Dados atualizados",
        message: "Informações do paciente salvas com sucesso.",
      });
    } catch (err) {
      console.error("Erro ao salvar dados do lead:", err);
      addToast({
        type: "error",
        title: "Erro ao salvar",
        message: "Não foi possível persistir as alterações.",
      });
      throw err;
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmarAgendamento = async (
    lead: Lead,
    dataStr: string,
    horarioStr: string,
    profissional: string,
    observacoes?: string
  ) => {
    try {
      setUpdatingId(lead.id);
      await api.createAppointment({
        leadId: lead.id,
        nomeCompleto: lead.nomeCompleto,
        telefone: lead.telefone,
        procedimento: lead.procedimento,
        tipoAtendimento: lead.tipoAtendimento,
        nomeConvenio: lead.nomeConvenio,
        data: dataStr,
        horarioInicio: horarioStr,
        profissional: profissional || "Dra. Camila Duarte",
        observacoes,
      });

      await carregarLeads();

      setIsScheduleModalOpen(false);
      setLeadToSchedule(null);

      addToast({
        type: "success",
        title: "Consulta Agendada no PostgreSQL!",
        message: `${lead.nomeCompleto} agendado para ${dataStr} às ${horarioStr} com ${profissional || "Dra. Camila Duarte"}.`,
      });
    } catch (err) {
      console.error("Erro ao confirmar agendamento:", err);
      addToast({
        type: "error",
        title: "Erro ao agendar",
        message: "Não foi possível confirmar o agendamento.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Contagem de atendimentos que requerem intervenção humana
  const unreadCount = leads.filter((l) => l.status === "TRANSBORDO_HUMANO").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Carregando painel clínico...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200 ease-in-out">
      {/* 1. Sidebar Fixa com Marca Oficial OdontoPrime */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadMessagesCount={unreadCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Conteúdo Principal à Direita da Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar com Indicador Reativo de Conexão e Seletor de Tema */}
        <Topbar
          theme={theme}
          onThemeChange={setTheme}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onNavigateTab={setActiveTab}
        />

        {/* 3. Área de Conteúdo da Tela Selecionada com Transições Nativas Tailwind v4 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto transition-all duration-200 ease-in-out">
          {activeTab === "inicio" && (
            <DashboardView
              onNavigateToAgenda={() => setActiveTab("agenda")}
              onNavigateToChat={() => setActiveTab("atendimento")}
            />
          )}

          {activeTab === "agenda" && <CalendarView />}

          {activeTab === "atendimento" && (
            <ChatView onEditCustomer={abrirDetalhesPorTelefone} />
          )}

          {activeTab === "clientes" && (
            <CustomersView onOpenDetails={abrirDetalhesPorTelefone} />
          )}

          {activeTab === "relatorios" && <ReportsView />}

          {activeTab === "configuracoes" && <AiSettingsView />}
        </main>
      </div>

      {/* Modais Globais de Detalhes e Agendamento */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onUpdateStatus={moverStatus}
        onResetSession={resetarSessao}
        onSaveLead={salvarLead}
        isUpdating={Boolean(updatingId && updatingId === selectedLead?.id)}
      />

      <ScheduleModal
        lead={leadToSchedule}
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setLeadToSchedule(null);
        }}
        onConfirmSchedule={confirmarAgendamento}
        isSaving={Boolean(updatingId && updatingId === leadToSchedule?.id)}
      />

      {/* Sistema de Notificações Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
