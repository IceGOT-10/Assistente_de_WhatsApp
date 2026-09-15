import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { DashboardStatsData } from "../../types/dashboard";

interface MetricCardsProps {
  stats: DashboardStatsData;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  const isPositiveTrend = stats.variacaoOntemPercentual >= 0;

  const cards = [
    {
      title: "Agendamentos hoje",
      value: stats.agendamentosHoje,
      icon: CalendarDays,
      badgeText: `${isPositiveTrend ? "+" : ""}${stats.variacaoOntemPercentual}% que ontem`,
      badgeType: isPositiveTrend ? "positive" : "negative",
      colorTheme: "emerald",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800",
      accentGlow: "from-emerald-500/10 to-transparent",
    },
    {
      title: "Confirmados",
      value: stats.confirmados,
      icon: CheckCircle2,
      subtitle: "Presença confirmada",
      colorTheme: "blue",
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800",
      accentGlow: "from-blue-500/10 to-transparent",
    },
    {
      title: "Aguardando confirmação",
      value: stats.aguardando,
      icon: Clock3,
      subtitle: "Recepção / Em contato",
      colorTheme: "amber",
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800",
      accentGlow: "from-amber-500/10 to-transparent",
    },
    {
      title: "Cancelados",
      value: stats.cancelados,
      icon: XCircle,
      subtitle: "Desistências do dia",
      colorTheme: "rose",
      iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800",
      accentGlow: "from-rose-500/10 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <div
            key={idx}
            className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all duration-200 ease-in-out group"
          >
            {/* Glow sutil de fundo */}
            <div
              className={`absolute -right-8 -top-8 w-28 h-28 bg-linear-to-bl ${card.accentGlow} rounded-full blur-2xl pointer-events-none`}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  {card.title}
                </span>

                <div className="mt-2.5 flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {card.value}
                  </span>

                  {card.badgeText && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        card.badgeType === "positive"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800"
                      }`}
                    >
                      {card.badgeType === "positive" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {card.badgeText}
                    </span>
                  )}
                </div>

                {card.subtitle && (
                  <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-400">
                    {card.subtitle}
                  </p>
                )}
              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} shadow-xs group-hover:scale-105 transition-transform duration-200`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

