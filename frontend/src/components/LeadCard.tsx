import { useState } from "react";
import {
  Phone,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sun,
  Moon,
  Check,
  Copy,
  HeartPulse,
} from "lucide-react";
import type { Lead, LeadStatus } from "../types/lead";
import {
  formatPhone,
  getWhatsAppLink,
  formatTimeAgo,
  getInitials,
  getAvatarColor,
  getPeriodoInfo,
} from "../utils/formatters";

interface LeadCardProps {
  lead: Lead;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onResetSession: (telefone: string) => Promise<void>;
  onOpenDetails: (lead: Lead) => void;
  isUpdating: boolean;
}

const STATUS_ORDER: LeadStatus[] = [
  "NOVO",
  "AGUARDANDO_CONFIRMACAO",
  "AGENDADO",
  "TRANSBORDO_HUMANO",
];

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onUpdateStatus,
  onResetSession,
  onOpenDetails,
  isUpdating,
}) => {
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const currentIndex = STATUS_ORDER.indexOf(lead.status);
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null;
  const nextStatus =
    currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;

  const periodoInfo = getPeriodoInfo(lead.periodoPreferencia);
  const avatarBg = getAvatarColor(lead.nomeCompleto);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lead.telefone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleResetSession = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Resetar sessão da IA no WhatsApp para ${lead.nomeCompleto}?`
      )
    ) {
      try {
        setIsResetting(true);
        await onResetSession(lead.telefone);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", lead.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable={!isUpdating}
      onDragStart={handleDragStart}
      onClick={() => onOpenDetails(lead)}
      className={`group relative bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer select-none ${
        isUpdating ? "opacity-60 pointer-events-none ring-2 ring-indigo-400" : ""
      }`}
    >
      {/* Top Header: Avatar, Name & Badge */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${avatarBg}`}
          >
            {getInitials(lead.nomeCompleto)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-sm leading-snug truncate group-hover:text-indigo-600 transition-colors">
              {lead.nomeCompleto}
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatTimeAgo(lead.createdAt)}
            </span>
          </div>
        </div>

        {/* Badge Particular / Convênio */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              lead.tipoAtendimento === "PARTICULAR"
                ? "bg-indigo-50/80 text-indigo-700 border-indigo-200/80"
                : "bg-emerald-50/80 text-emerald-700 border-emerald-200/80"
            }`}
          >
            {lead.tipoAtendimento}
          </span>
          {lead.nomeConvenio && (
            <span
              className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 max-w-[100px] truncate"
              title={lead.nomeConvenio}
            >
              {lead.nomeConvenio}
            </span>
          )}
        </div>
      </div>

      {/* Procedure Tag */}
      <div className="mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-semibold">
          <HeartPulse className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">{lead.procedimento}</span>
        </div>
      </div>

      {/* Contact & Preferences Details */}
      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
        {/* WhatsApp Phone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono font-medium text-slate-700">
              {formatPhone(lead.telefone)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyPhone}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Copiar número"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <a
              href={getWhatsAppLink(lead.telefone, lead.nomeCompleto)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              title="Conversar no WhatsApp"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Turno */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            {periodoInfo.icon === "sun" && (
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            {periodoInfo.icon === "moon" && (
              <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            {periodoInfo.icon === "clock" && (
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>Turno:</span>
          </span>
          <span className="font-semibold text-slate-700">
            {periodoInfo.label}
          </span>
        </div>
      </div>

      {/* Card Action Footer */}
      <div
        className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick Stepper or Status Select */}
        <div className="flex items-center gap-1">
          {prevStatus && (
            <button
              onClick={() => onUpdateStatus(lead.id, prevStatus)}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer"
              title={`Voltar para ${prevStatus}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <select
            value={lead.status}
            onChange={(e) =>
              onUpdateStatus(lead.id, e.target.value as LeadStatus)
            }
            className="text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="NOVO">Novos Leads</option>
            <option value="AGUARDANDO_CONFIRMACAO">Aguardando Confirmação</option>
            <option value="AGENDADO">Agendado</option>
            <option value="TRANSBORDO_HUMANO">Transbordo Humano</option>
          </select>

          {nextStatus && (
            <button
              onClick={() => onUpdateStatus(lead.id, nextStatus)}
              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 hover:text-indigo-800 text-xs transition-colors cursor-pointer"
              title={`Avançar para ${nextStatus}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Reset IA Button */}
        <button
          onClick={handleResetSession}
          disabled={isResetting}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
          title="Resetar atendimento / IA WhatsApp"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-indigo-600" : ""}`}
          />
        </button>
      </div>
    </div>
  );
};
