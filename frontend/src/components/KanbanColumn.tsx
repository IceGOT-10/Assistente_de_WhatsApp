import { useState } from "react";
import {
  UserPlus,
  Clock,
  CalendarCheck2,
  Headphones,
  Inbox,
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
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "AGUARDANDO_CONFIRMACAO":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "AGENDADO":
        return <CalendarCheck2 className="w-4 h-4 text-emerald-600" />;
      case "TRANSBORDO_HUMANO":
        return <Headphones className="w-4 h-4 text-purple-600" />;
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-100/70 rounded-2xl border-t-4 ${
        column.color.border
      } border-x border-b border-slate-200/80 p-3.5 sm:p-4 min-h-[580px] transition-all duration-200 ${
        isDragOver
          ? "ring-2 ring-indigo-400 bg-indigo-50/40 shadow-md scale-[1.01]"
          : "shadow-xs"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-200/60">
            {getColumnIcon()}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">
              {column.label}
            </h3>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">
              {column.description}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${column.color.badge}`}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards List / Container */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-0.5 max-h-[720px]">
        {leads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200/80 rounded-xl bg-white/40">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Inbox className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-600">
              Nenhum paciente nesta etapa
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
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
