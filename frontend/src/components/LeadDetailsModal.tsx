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
  Edit3,
  Save,
  PauseCircle,
  CalendarCheck,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type {
  Lead,
  LeadStatus,
  PeriodoPreferencia,
  TipoAtendimento,
  UpdateLeadDTO,
} from "../types/lead";
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
  onSaveLead: (id: string, data: UpdateLeadDTO) => Promise<void>;
  isUpdating: boolean;
}

const STATUS_OPTIONS: { status: LeadStatus; label: string; color: string }[] = [
  {
    status: "NOVO",
    label: "Pré-Agendamentos",
    color:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60",
  },
  {
    status: "AGUARDANDO_CONFIRMACAO",
    label: "Em Negociação",
    color:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60",
  },
  {
    status: "AGENDADO",
    label: "Consultas Agendadas",
    color:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60",
  },
  {
    status: "TRANSBORDO_HUMANO",
    label: "Atenção da Recepção",
    color:
      "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60",
  },
];

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onResetSession,
  onSaveLead,
  isUpdating,
}) => {
  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <LeadDetailsModalContent
        key={lead.id}
        lead={lead}
        onClose={onClose}
        onUpdateStatus={onUpdateStatus}
        onResetSession={onResetSession}
        onSaveLead={onSaveLead}
        isUpdating={isUpdating}
      />
    </div>
  );
};

interface LeadDetailsModalContentProps {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onResetSession: (telefone: string) => Promise<void>;
  onSaveLead: (id: string, data: UpdateLeadDTO) => Promise<void>;
  isUpdating: boolean;
}

const LeadDetailsModalContent: React.FC<LeadDetailsModalContentProps> = ({
  lead,
  onClose,
  onUpdateStatus,
  onResetSession,
  onSaveLead,
  isUpdating,
}) => {
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states inicializados diretamente dos dados do lead
  const [nomeCompleto, setNomeCompleto] = useState(() => lead.nomeCompleto || "");
  const [telefone, setTelefone] = useState(() => lead.telefone || "");
  const [procedimento, setProcedimento] = useState(() => lead.procedimento || "");
  const [periodoPreferencia, setPeriodoPreferencia] =
    useState<PeriodoPreferencia>(() => lead.periodoPreferencia || "QUALQUER");
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>(
    () => lead.tipoAtendimento || "PARTICULAR"
  );
  const [nomeConvenio, setNomeConvenio] = useState(() => lead.nomeConvenio || "");
  const [observacoes, setObservacoes] = useState(() => lead.observacoes || "");
  const [dataAgendamento, setDataAgendamento] = useState(
    () => lead.dataAgendamento || ""
  );
  const [horarioAgendado, setHorarioAgendado] = useState(
    () => lead.horarioAgendado || ""
  );

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveLead(lead.id, {
        nomeCompleto,
        telefone: telefone.replace(/\D/g, ""),
        procedimento,
        tipoAtendimento,
        nomeConvenio: tipoAtendimento === "CONVENIO" ? nomeConvenio : null,
        periodoPreferencia,
        observacoes,
        dataAgendamento: dataAgendamento || null,
        horarioAgendado: horarioAgendado || null,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${avatarBg}`}
          >
            {getInitials(lead.nomeCompleto)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {lead.nomeCompleto}
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  lead.tipoAtendimento === "PARTICULAR"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {lead.tipoAtendimento}
              </span>

              {/* Badge Sofia em Pausa */}
              {lead.status === "TRANSBORDO_HUMANO" && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 animate-pulse">
                  <PauseCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  Sofia em pausa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastrado {formatTimeAgo(lead.createdAt)} •{" "}
              {formatFullDate(lead.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isEditing
                ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Cancelar Edição" : "Editar Dados"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="p-6 overflow-y-auto space-y-6">
        {/* MODO DE EDIÇÃO ATIVO */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                Edite os dados cadastrais e observações do paciente. As alterações
                serão salvas imediatamente no sistema da clínica.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: 11988887777"
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Procedimento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Procedimento
                </label>
                <input
                  type="text"
                  required
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  placeholder="Ex: Avaliação Geral, Implante, Limpeza..."
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Turno de Preferência */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Turno de Preferência
                </label>
                <select
                  value={periodoPreferencia || "QUALQUER"}
                  onChange={(e) =>
                    setPeriodoPreferencia(
                      e.target.value as PeriodoPreferencia
                    )
                  }
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="MANHA">Manhã (08h - 12h)</option>
                  <option value="TARDE">Tarde (13h - 18h)</option>
                  <option value="QUALQUER">Qualquer horário</option>
                </select>
              </div>

              {/* Modalidade (Particular / Convênio) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Modalidade de Atendimento
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoAtendimento("PARTICULAR")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      tipoAtendimento === "PARTICULAR"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Particular
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAtendimento("CONVENIO")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      tipoAtendimento === "CONVENIO"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Convênio
                  </button>
                </div>
              </div>

              {/* Nome do Convênio se selecionado */}
              {tipoAtendimento === "CONVENIO" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Convênio / Plano
                  </label>
                  <input
                    type="text"
                    required={tipoAtendimento === "CONVENIO"}
                    value={nomeConvenio}
                    onChange={(e) => setNomeConvenio(e.target.value)}
                    placeholder="Ex: Unimed, Amil, SulAmérica..."
                    className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Data e Horário de Agendamento (se aplicável ou se agendado) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Data e Horário do Agendamento (Opcional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Data da Consulta
                  </label>
                  <input
                    type="date"
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={horarioAgendado}
                    onChange={(e) => setHorarioAgendado(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Observações da Recepção */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Observações da Recepção (Texto Livre)
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações internas da equipe de atendimento, preferências do paciente, restrições de datas..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Botões de Ação do Form */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* MODO DE VISUALIZAÇÃO PADRÃO */
          <>
            {/* Alerta se Sofia estiver em pausa */}
            {lead.status === "TRANSBORDO_HUMANO" && (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Atenção da Recepção: Sofia em Pausa
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 leading-relaxed">
                    Este atendimento foi transferido para a equipe física. A
                    inteligência artificial está temporariamente pausada para
                    permitir que a recepção negocie diretamente pelo WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Procedimento Solicitado
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {lead.procedimento}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Turno de Preferência
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  {periodoInfo.label}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  WhatsApp / Telefone
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-mono">
                    {formatPhone(lead.telefone)}
                  </span>
                  <button
                    onClick={handleCopyPhone}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Copiar número"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Convênio / Plano
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {lead.nomeConvenio
                    ? lead.nomeConvenio
                    : "Atendimento Particular"}
                </p>
              </div>
            </div>

            {/* Data de Agendamento se confirmada */}
            {lead.status === "AGENDADO" && lead.dataAgendamento && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 text-xs font-semibold">
                  <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Consulta confirmada para{" "}
                    <strong>{lead.dataAgendamento}</strong>
                    {lead.horarioAgendado && (
                      <span> às {lead.horarioAgendado}</span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                  Confirmado
                </span>
              </div>
            )}

            {/* Observações da Recepção (se houver) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Observações da Recepção
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Editar nota
                </button>
              </div>
              {lead.observacoes ? (
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {lead.observacoes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Nenhuma observação registrada para este paciente ainda. Clique
                  em "Editar Dados" para incluir anotações.
                </p>
              )}
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                title="Libera a Sofia e reinicia o contexto do WhatsApp"
              >
                <RotateCcw
                  className={`w-4 h-4 ${
                    isResetting
                      ? "animate-spin text-indigo-600 dark:text-indigo-400"
                      : ""
                  }`}
                />
                <span>{isResetting ? "Resetando..." : "Resetar Sessão IA"}</span>
              </button>
            </div>

            {/* Move Status Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                Mudar Etapa do Funil
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
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs cursor-default"
                          : `${opt.color} disabled:opacity-50`
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          ID do Lead: <span className="font-mono">{lead.id.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Cadastro</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
