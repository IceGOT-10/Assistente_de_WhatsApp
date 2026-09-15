import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import type { ProfessionalItem } from "../../types/appointment";

interface CalendarToolbarProps {
  currentDate: Date;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  viewMode: "dia" | "semana" | "mes";
  onViewModeChange: (mode: "dia" | "semana" | "mes") => void;
  selectedProfissional: string;
  onProfissionalChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  onOpenNewModal: () => void;
  professionals?: ProfessionalItem[];
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  onPrevPeriod,
  onNextPeriod,
  onToday,
  viewMode,
  onViewModeChange,
  selectedProfissional,
  onProfissionalChange,
  selectedStatus,
  onStatusChange,
  onOpenNewModal,
  professionals = [],
}) => {
  const monthYearStr = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const formattedMonthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);

  return (
    <div className="space-y-4">
      {/* Linha Superior: Título & Botão + Novo Agendamento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Agenda Clínica</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie consultas, horários dos profissionais e triagens confirmadas.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-500/30 transition-all duration-200 cursor-pointer group shrink-0"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>+ Novo agendamento</span>
        </button>
      </div>

      {/* Linha Inferior: Navegador de Data, Alternador de Visão e Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Navegador de Data */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer"
          >
            Hoje
          </button>

          <div className="flex items-center rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-0.5">
            <button
              type="button"
              onClick={onPrevPeriod}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150 cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextPeriod}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150 cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 ml-1">
            {formattedMonthYear}
          </span>
        </div>

        {/* Alternador de Visão (Dia, Semana, Mês) */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
          {(["dia", "semana", "mes"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-all duration-150 cursor-pointer ${
                viewMode === mode
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          
          <select
            value={selectedProfissional}
            onChange={(e) => onProfissionalChange(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Profissional: Todos</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.nome}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Status: Todos</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>
    </div>
  );
};

