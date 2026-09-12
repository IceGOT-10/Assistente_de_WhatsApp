import { useState } from "react";
import {
  X,
  Phone,
  Clock,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import type { Lead, LeadStatus } from "../types/lead";
import {
  formatPhone,
  getWhatsAppLink,
  formatFullDate,
  formatTimeAgo,
  getInitials,
  getAvatarColor,
  getPeriodoInfo,
} from "../utils/formatters";

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onResetSession: (telefone: string) => Promise<void>;
  isUpdating: boolean;
}

const STATUS_OPTIONS: { status: LeadStatus; label: string; color: string }[] = [
  {
    status: "NOVO",
    label: "Novos Leads",
    color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  {
    status: "AGUARDANDO_CONFIRMACAO",
    label: "Aguardando Confirmação",
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  {
    status: "AGENDADO",
    label: "Agendado",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    status: "TRANSBORDO_HUMANO",
    label: "Transbordo Humano",
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
];

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onResetSession,
  isUpdating,
}) => {
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen || !lead) return null;

  const periodoInfo = getPeriodoInfo(lead.periodoPreferencia);
  const avatarBg = getAvatarColor(lead.nomeCompleto);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.telefone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetSessionClick = async () => {
    if (
      window.confirm(
        `Deseja realmente resetar a sessão e liberar a IA do WhatsApp para ${lead.nomeCompleto}?`
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold border ${avatarBg}`}
            >
              {getInitials(lead.nomeCompleto)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {lead.nomeCompleto}
                </h3>
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    lead.tipoAtendimento === "PARTICULAR"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {lead.tipoAtendimento}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastrado {formatTimeAgo(lead.createdAt)} •{" "}
                {formatFullDate(lead.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Procedimento Solicitado
              </span>
              <p className="text-sm font-bold text-slate-800">
                {lead.procedimento}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Turno de Preferência
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                {periodoInfo.label}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                WhatsApp / Telefone
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 font-mono">
                  {formatPhone(lead.telefone)}
                </span>
                <button
                  onClick={handleCopyPhone}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copiar número"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Convênio / Plano
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {lead.nomeConvenio ? lead.nomeConvenio : "Atendimento Particular"}
              </p>
            </div>
          </div>

          {/* Direct Communication Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={getWhatsAppLink(lead.telefone, lead.nomeCompleto)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Conversar no WhatsApp Web</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={handleResetSessionClick}
              disabled={isResetting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              title="Libera o bot e reinicia o contexto do WhatsApp"
            >
              <RotateCcw
                className={`w-4 h-4 ${isResetting ? "animate-spin text-indigo-600" : ""}`}
              />
              <span>{isResetting ? "Resetando..." : "Resetar Sessão IA"}</span>
            </button>
          </div>

          {/* Move Status Section */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Mudar Etapa do Kanban
            </span>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = lead.status === opt.status;
                return (
                  <button
                    key={opt.status}
                    onClick={() => onUpdateStatus(lead.id, opt.status)}
                    disabled={isUpdating || isActive}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs cursor-default"
                        : `${opt.color} disabled:opacity-50`
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
