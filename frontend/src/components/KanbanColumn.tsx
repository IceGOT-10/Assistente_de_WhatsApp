import { useState } from "react";
import {
  UserPlus,
  Clock,
  CalendarCheck2,
  Headphones,
  Inbox,
  PauseCircle,
} from "lucide-react";
import type { ColumnConfig, Lead, LeadStatus } from "../types/lead";
import { LeadCard } from "./LeadCard";

interface KanbanColumnProps {
  column: ColumnConfig;
  leads: Lead[];
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onResetSession: (telefone: string) => Promise<void>;
  onOpenDetails: (lead: Lead) => void;
  updatingId: string | null;
}

export const KanbanColumn = ({
  column,
  leads,
  onUpdateStatus,
  onResetSession,
  onOpenDetails,
  updatingId,
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getColumnIcon = () => {
    switch (column.key) {
      case "NOVO":
        return <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "AGUARDANDO_CONFIRMACAO":
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "AGENDADO":
        return <CalendarCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "TRANSBORDO_HUMANO":
        return <Headphones className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      await onUpdateStatus(leadId, column.key);
    }
  };

  const isTransbordo = column.key === "TRANSBORDO_HUMANO";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border-t-4 ${
        column.color.border
      } border-x border-b border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 min-h-[580px] transition-all duration-200 ${
        isDragOver
          ? "ring-2 ring-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md scale-[1.01]"
          : "shadow-xs"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-slate-700">
            {getColumnIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                {column.label}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
              {column.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Badge Indicativo de Sofia em Pausa */}
          {isTransbordo && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs animate-pulse"
              title="A IA Sofia está em pausa para estes atendimentos aguardando ação da equipe"
            >
              <PauseCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Sofia pausada</span>
            </span>
          )}

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${column.color.badge}`}
          >
            {leads.length}
          </span>
        </div>
      </div>

      {/* Cards List / Container */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-0.5 max-h-[720px]">
        {leads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-900/40">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
              <Inbox className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nenhum paciente nesta etapa
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[180px]">
              Arraste um cartão para cá ou aguarde novas triagens automáticas.
            </p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onUpdateStatus={onUpdateStatus}
              onResetSession={onResetSession}
              onOpenDetails={onOpenDetails}
              isUpdating={updatingId === lead.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
