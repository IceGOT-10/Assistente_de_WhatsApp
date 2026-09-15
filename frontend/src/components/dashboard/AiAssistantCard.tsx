import React from "react";
import {
  Bot,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CalendarPlus,
  CheckCircle2,
  CalendarSync,
  UserCheck,
} from "lucide-react";
import type { DashboardStatsData } from "../../types/dashboard";

interface AiAssistantCardProps {
  stats: DashboardStatsData;
  onNavigateToChat: () => void;
}

export const AiAssistantCard: React.FC<AiAssistantCardProps> = ({
  stats,
  onNavigateToChat,
}) => {
  const metricRows = [
    {
      label: "Atendimentos",
      value: stats.iaAcoes.atendimentos,
      icon: MessageSquare,
      color: "text-indigo-500",
    },
    {
      label: "Agendamentos",
      value: stats.iaAcoes.agendamentos,
      icon: CalendarPlus,
      color: "text-emerald-500",
    },
    {
      label: "Confirmações",
      value: stats.iaAcoes.confirmacoes,
      icon: CheckCircle2,
      color: "text-sky-500",
    },
    {
      label: "Reagendamentos",
      value: stats.iaAcoes.reagendamentos,
      icon: CalendarSync,
      color: "text-amber-500",
    },
    {
      label: "Encaminhamento para atendente",
      value: stats.iaAcoes.encaminhamentos,
      icon: UserCheck,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all duration-200 ease-in-out flex flex-col justify-between">
      {/* Topo: Ícone + Título + Badge de Ativa */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Assistente IA
                </h2>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xs text-slate-400">Sofia • Triagem 24h</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              stats.iaAtiva
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                stats.iaAtiva ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {stats.iaAtiva ? "Ativa" : "Pausada"}
          </span>
        </div>

        {/* Subtítulo informativo */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-2 font-medium">
          Ações realizadas no WhatsApp hoje:
        </p>

        {/* Lista de Métricas Diárias */}
        <div className="space-y-2.5 my-3">
          {metricRows.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-150 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${row.color}`} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {row.label}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 shadow-2xs">
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão de Ação Rápida */}
      <button
        type="button"
        onClick={onNavigateToChat}
        className="w-full mt-4 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs shadow-indigo-500/30 transition-all duration-200 cursor-pointer group"
      >
        <span>Ver conversas da IA</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>
  );
};

