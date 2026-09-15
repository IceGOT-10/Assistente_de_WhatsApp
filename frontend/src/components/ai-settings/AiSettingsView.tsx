import React, { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  CalendarPlus,
  CalendarX,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../services/api";
import type { AiConfigData } from "../../types/aiConfig";

export const AiSettingsView: React.FC = () => {
  const [iaAtiva, setIaAtiva] = useState(true);
  const [nomeAssistente, setNomeAssistente] = useState("Sofia");
  const [mensagemInicial, setMensagemInicial] = useState("");

  const [permissoes, setPermissoes] = useState({
    consultarHorarios: true,
    criarAgendamentos: true,
    reagendar: true,
    cancelar: true,
    confirmarAtendimento: true,
    responderDuvidas: true,
  });

  const [gatilhosTransbordo, setGatilhosTransbordo] = useState({
    pedirHumano: true,
    reclamacao: true,
    situacaoNaoIdentificada: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const carregarConfig = useCallback(async () => {
    try {
      const data: AiConfigData = await api.getAiConfig();
      if (data) {
        setIaAtiva(data.iaAtiva);
        setNomeAssistente(data.nomeAssistente);
        setMensagemInicial(data.mensagemInicial);
        if (data.permissoes) setPermissoes(data.permissoes);
        if (data.gatilhosTransbordo) setGatilhosTransbordo(data.gatilhosTransbordo);
      }
    } catch (e) {
      console.error("Erro ao carregar configurações da IA:", e);
    }
  }, []);

  useEffect(() => {
    carregarConfig();
  }, [carregarConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateAiConfig({
        iaAtiva,
        nomeAssistente,
        mensagemInicial,
        permissoes,
        gatilhosTransbordo,
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    } catch (e) {
      console.error("Erro ao salvar parâmetros da IA:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 transition-all duration-200 ease-in-out">
      {/* Topo / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Bot className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>Configurações do Assistente IA</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize o comportamento, mensagens de acolhimento e regras de transbordo humano.
            </p>
          </div>
        </div>

        {/* Switch Mestre: IA Ativa / Pausada */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {iaAtiva ? "IA Ativa no WhatsApp" : "IA Pausada"}
          </span>
          <button
            type="button"
            onClick={() => setIaAtiva(!iaAtiva)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              iaAtiva ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                iaAtiva ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Identidade e Mensagem Inicial */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Identidade do Assistente
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Nome do Assistente
              </label>
              <input
                type="text"
                required
                value={nomeAssistente}
                onChange={(e) => setNomeAssistente(e.target.value)}
                className="w-full max-w-sm px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nome apresentado nas primeiras interações aos pacientes da clínica.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Mensagem Inicial (Saudação de Boas-Vindas)
              </label>
              <textarea
                rows={3}
                required
                value={mensagemInicial}
                onChange={(e) => setMensagemInicial(e.target.value)}
                placeholder="Ex: Olá! Sou a Sofia, assistente virtual da Clínica OdontoPrime..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enviada automaticamente quando um novo paciente envia mensagem pela primeira vez.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: O que a IA pode fazer? (Checklist de Automação) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              O que a IA pode fazer?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Habilite as tarefas autônomas permitidas durante o diálogo no WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { key: "consultarHorarios", label: "Consultar horários disponíveis", icon: Clock },
              { key: "criarAgendamentos", label: "Criar novos agendamentos", icon: CalendarPlus },
              { key: "reagendar", label: "Reagendar consultas existentes", icon: Sparkles },
              { key: "cancelar", label: "Cancelar agendamentos sob demanda", icon: CalendarX },
              { key: "confirmarAtendimento", label: "Confirmar atendimento e presença", icon: CheckCircle2 },
              { key: "responderDuvidas", label: "Responder dúvidas frequentes", icon: HelpCircle },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(permissoes as any)[item.key]}
                  onChange={(e) =>
                    setPermissoes({ ...permissoes, [item.key]: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <item.icon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Bloco 3: Quando chamar um atendente? (Transbordo Humano) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Quando chamar um atendente?</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Condições que pausam a IA e transferem o atendimento imediatamente para a recepção.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              {
                key: "pedirHumano",
                label: "Cliente pedir atendimento humano expressamente",
                desc: "Palavras-chave como 'humano', 'atendente', 'falar com alguém'.",
                icon: UserCheck,
              },
              {
                key: "reclamacao",
                label: "Detecção de insatisfação ou reclamação",
                desc: "Tratamento prioritário da recepção em casos de descontentamento.",
                icon: ShieldAlert,
              },
              {
                key: "situacaoNaoIdentificada",
                label: "Situação complexa não identificada pelo sistema",
                desc: "Casos clínicos atípicos que necessitem de triagem técnica presencial.",
                icon: HelpCircle,
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(gatilhosTransbordo as any)[item.key]}
                  onChange={(e) =>
                    setGatilhosTransbordo({
                      ...gatilhosTransbordo,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Botão de Rodapé Salvar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {saveFeedback ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configurações salvas e aplicadas com sucesso no assistente!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              As alterações surtem efeito instantâneo no fluxo do WhatsApp.
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Salvando..." : "Salvar alterações"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
