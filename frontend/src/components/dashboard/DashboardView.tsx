import React, { useEffect, useState, useCallback } from "react";
import { MetricCards } from "./MetricCards";
import { NextAppointmentsTable } from "./NextAppointmentsTable";
import { AiAssistantCard } from "./AiAssistantCard";
import { api } from "../../services/api";
import type { DashboardStatsData, UpcomingAppointment } from "../../types/dashboard";
import { RotateCw } from "lucide-react";

interface DashboardViewProps {
  onNavigateToAgenda: () => void;
  onNavigateToChat: () => void;
}

const DEFAULT_STATS: DashboardStatsData = {
  agendamentosHoje: 0,
  confirmados: 0,
  aguardando: 0,
  cancelados: 0,
  variacaoOntemPercentual: 0,
  iaAtiva: true,
  iaAcoes: {
    atendimentos: 0,
    agendamentos: 0,
    confirmacoes: 0,
    reagendamentos: 0,
    encaminhamentos: 0,
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToAgenda,
  onNavigateToChat,
}) => {
  const [stats, setStats] = useState<DashboardStatsData>(DEFAULT_STATS);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const carregarDados = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [statsData, upcomingData] = await Promise.all([
        api.getDashboardStats(),
        api.getUpcomingAppointments(),
      ]);

      if (statsData) setStats(statsData);
      if (upcomingData) setAppointments(upcomingData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    const carregarInicial = async () => {
      try {
        const [statsData, upcomingData] = await Promise.all([
          api.getDashboardStats(),
          api.getUpcomingAppointments(),
        ]);
        if (ativo) {
          if (statsData) setStats(statsData);
          if (upcomingData) setAppointments(upcomingData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    };

    carregarInicial();
    const interval = setInterval(carregarInicial, 10000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 transition-all duration-200 ease-in-out">
      {/* Barra de Título & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Painel Geral da Clínica
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhe o fluxo de pacientes, agendamentos e o desempenho da IA em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => carregarDados(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-all duration-200 disabled:opacity-60 cursor-pointer self-start sm:self-auto"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}
          />
          <span>{isRefreshing ? "Sincronizando..." : "Atualizar métricas"}</span>
        </button>
      </div>

      {/* 4 Cards de Métricas */}
      <MetricCards stats={stats} />

      {/* Grade Principal: Próximos Atendimentos (Esquerda) + Card Assistente IA (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <NextAppointmentsTable
            appointments={appointments}
            onNavigateToAgenda={onNavigateToAgenda}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <AiAssistantCard
            stats={stats}
            onNavigateToChat={onNavigateToChat}
          />
        </div>
      </div>
    </div>
  );
};
