import {
  Users,
  Clock,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import type { DashboardStats } from "../types/lead";

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: "Total de Leads",
      value: stats.totalLeads,
      subtitle: `${stats.novosLeads} novos contatos`,
      icon: Users,
      trend: "Total acumulado",
      color: "blue",
      bgGradient: "from-blue-500/10 via-sky-500/5 to-transparent",
      iconBg: "bg-blue-50 text-blue-600 border border-blue-200/60",
      accentBorder: "border-blue-500/20",
    },
    {
      title: "Aguardando Confirmação",
      value: stats.aguardandoConfirmacao,
      subtitle: "Triagem concluída pela IA",
      icon: Clock,
      trend: "Requer atenção",
      color: "amber",
      bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60",
      accentBorder: "border-amber-500/20",
    },
    {
      title: "Agendados",
      value: stats.agendados,
      subtitle: "Consultas confirmadas",
      icon: CalendarCheck,
      trend: "Convertidos",
      color: "emerald",
      bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
      accentBorder: "border-emerald-500/20",
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.taxaConversao.toFixed(1)}%`,
      subtitle: `${stats.agendados} de ${stats.totalLeads} leads`,
      icon: TrendingUp,
      trend: "Eficiência do funil",
      color: "indigo",
      bgGradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
      iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-200/60",
      accentBorder: "border-indigo-500/20",
      isRate: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 group`}
          >
            {/* Ambient subtle glow background */}
            <div
              className={`absolute -right-8 -top-8 w-32 h-32 bg-linear-to-bl ${card.bgGradient} rounded-full blur-2xl pointer-events-none`}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                </div>
              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} shadow-xs group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600 truncate">
                {card.subtitle}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                {card.trend}
              </span>
            </div>

            {/* Visual mini progress bar for Conversion Rate */}
            {card.isRate && (
              <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-linear-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, stats.taxaConversao))}%`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
