import { useState, useEffect } from "react";
import {
  RotateCw,
  Search,
  Filter,
  X,
  Stethoscope,
  Radio,
} from "lucide-react";
import type { TipoAtendimento } from "../types/lead";

interface HeaderProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tipoFilter: "ALL" | TipoAtendimento;
  onTipoFilterChange: (tipo: "ALL" | TipoAtendimento) => void;
  totalLeads: number;
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
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

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
    <header className="bg-white border-b border-slate-200/80 shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 gap-4 border-b border-slate-100">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50">
              <Stethoscope className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  Odonto<span className="text-indigo-600">Prime</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                  SaaS Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Painel de Triagem & Atendimento WhatsApp 24h
              </p>
            </div>
          </div>

          {/* System Status, Clock & Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
            {/* Live System Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">IA & WhatsApp:</span>
              <span className="flex items-center gap-1 font-bold">
                <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                Online / Sincronizado
              </span>
            </div>

            {/* Realtime Clock */}
            <div className="hidden md:flex flex-col text-right pr-1">
              <span className="text-xs font-semibold text-slate-700 font-mono tracking-tight">
                {currentTime}
              </span>
              <span className="text-[11px] text-slate-400 capitalize font-medium">
                {currentDate}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-60 cursor-pointer"
              title="Atualizar dados agora"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? "animate-spin text-indigo-400" : ""
                }`}
              />
              <span>{isRefreshing ? "Sincronizando..." : "Sincronizar"}</span>
            </button>
          </div>
        </div>

        {/* Bottom Control Bar: Search & Quick Filters */}
        <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar paciente, telefone ou procedimento..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Total count info */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center text-xs text-slate-400 font-medium mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Filtrar:</span>
            </div>

            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
              <button
                onClick={() => onTipoFilterChange("ALL")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  tipoFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todos ({totalLeads})
              </button>
              <button
                onClick={() => onTipoFilterChange("PARTICULAR")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  tipoFilter === "PARTICULAR"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Particular
              </button>
              <button
                onClick={() => onTipoFilterChange("CONVENIO")}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  tipoFilter === "CONVENIO"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Convênio
              </button>
            </div>

            {lastUpdated && (
              <span className="hidden xl:inline text-[11px] text-slate-400 font-medium ml-2">
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
