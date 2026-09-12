import { useState, useEffect } from "react";
import {
  RotateCw,
  Search,
  Filter,
  X,
  Stethoscope,
  Radio,
  Kanban,
  Calendar,
  Sun,
  Moon,
  Laptop,
  WifiOff,
} from "lucide-react";
import type { TipoAtendimento, ThemeMode, ViewMode } from "../types/lead";
import { api } from "../services/api";

interface HeaderProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tipoFilter: "ALL" | TipoAtendimento;
  onTipoFilterChange: (tipo: "ALL" | TipoAtendimento) => void;
  totalLeads: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  lastUpdated,
  searchTerm,
  onSearchChange,
  tipoFilter,
  onTipoFilterChange,
  totalLeads,
  viewMode,
  onViewModeChange,
  theme,
  onThemeChange,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);

  // Verificação periódica a cada 5 segundos da saúde do servidor
  useEffect(() => {
    let isMounted = true;

    const checkServerHealth = async () => {
      try {
        await api.checkHealth();
        if (isMounted) {
          setIsServerOnline(true);
        }
      } catch {
        if (isMounted) {
          setIsServerOnline(false);
        }
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3.5 gap-4 border-b border-slate-100 dark:border-slate-800">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-950/40">
              <Stethoscope className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Odonto<span className="text-indigo-600 dark:text-indigo-400">Prime</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                  Recepção Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Painel de Atendimento & Triagem WhatsApp 24h
              </p>
            </div>
          </div>

          {/* Controls: View Switcher, Theme Selector, Live Status & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-between lg:justify-end">
            {/* View Mode Switcher: Kanban vs Calendário */}
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
              <button
                onClick={() => onViewModeChange("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Quadro Kanban</span>
              </button>
              <button
                onClick={() => onViewModeChange("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendário da Clínica</span>
              </button>
            </div>

            {/* Seletor de Tema: Claro / Escuro / Sistema */}
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs" title="Tema de exibição">
              <button
                type="button"
                onClick={() => onThemeChange("light")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white text-amber-500 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Tema Claro"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange("dark")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-700 text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Tema Escuro"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange("system")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  theme === "system"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Automático (Tema do Sistema)"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>

            {/* Live Server & IA Status Indicator */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isServerOnline
                  ? "bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50/80 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 animate-pulse"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isServerOnline ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isServerOnline ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                ></span>
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                {isServerOnline ? (
                  <>
                    <Radio className="w-3 h-3 animate-pulse text-emerald-600 dark:text-emerald-400" />
                    <span>IA & Servidor: Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>Servidor: Offline</span>
                  </>
                )}
              </span>
            </div>

            {/* Realtime Clock */}
            <div className="hidden xl:flex flex-col text-right pr-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 font-mono tracking-tight">
                {currentTime}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 capitalize font-medium">
                {currentDate}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold border border-transparent dark:border-slate-700 shadow-xs hover:shadow transition-all disabled:opacity-60 cursor-pointer"
              title="Atualizar dados agora"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? "animate-spin text-indigo-400" : ""
                }`}
              />
              <span className="hidden sm:inline">
                {isRefreshing ? "Sincronizando..." : "Sincronizar"}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Control Bar: Search & Quick Filters */}
        <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar paciente, telefone ou procedimento..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Total count info */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Filtrar:</span>
            </div>

            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
              <button
                onClick={() => onTipoFilterChange("ALL")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  tipoFilter === "ALL"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Todos ({totalLeads})
              </button>
              <button
                onClick={() => onTipoFilterChange("PARTICULAR")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  tipoFilter === "PARTICULAR"
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Particular
              </button>
              <button
                onClick={() => onTipoFilterChange("CONVENIO")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  tipoFilter === "CONVENIO"
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Convênio
              </button>
            </div>

            {lastUpdated && (
              <span className="hidden xl:inline text-[11px] text-slate-400 dark:text-slate-500 font-medium ml-2">
                Última sincronização:{" "}
                {lastUpdated.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
