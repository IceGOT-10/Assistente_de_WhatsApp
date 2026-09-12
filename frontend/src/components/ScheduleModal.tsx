import { useState } from "react";
import {
  CalendarCheck,
  Clock,
  Calendar as CalendarIcon,
  X,
  FileText,
  User,
  Sparkles,
} from "lucide-react";
import type { Lead } from "../types/lead";
import { formatPhone } from "../utils/formatters";

interface ScheduleModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirmSchedule: (
    leadId: string,
    dataAgendamento: string,
    horarioAgendado: string,
    observacoes?: string
  ) => Promise<void>;
  isSaving?: boolean;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirmSchedule,
  isSaving = false,
}) => {
  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <ScheduleModalForm
        key={lead.id}
        lead={lead}
        onClose={onClose}
        onConfirmSchedule={onConfirmSchedule}
        isSaving={isSaving}
      />
    </div>
  );
};

interface ScheduleModalFormProps {
  lead: Lead;
  onClose: () => void;
  onConfirmSchedule: (
    leadId: string,
    dataAgendamento: string,
    horarioAgendado: string,
    observacoes?: string
  ) => Promise<void>;
  isSaving: boolean;
}

const ScheduleModalForm: React.FC<ScheduleModalFormProps> = ({
  lead,
  onClose,
  onConfirmSchedule,
  isSaving,
}) => {
  const getDefaultDate = () => {
    if (lead.dataAgendamento) return lead.dataAgendamento;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    return tomorrow.toISOString().split("T")[0];
  };

  const getDefaultHorario = () => {
    if (lead.horarioAgendado) return lead.horarioAgendado;
    return lead.periodoPreferencia === "TARDE" ? "14:30" : "09:30";
  };

  const [data, setData] = useState<string>(getDefaultDate);
  const [horario, setHorario] = useState<string>(getDefaultHorario);
  const [obs, setObs] = useState<string>(() => lead.observacoes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !horario) return;
    await onConfirmSchedule(lead.id, data, horario, obs);
    onClose();
  };

  const getTurnoCalculado = (hora: string) => {
    const h = parseInt(hora.split(":")[0], 10);
    return h < 12 ? "Manhã (08h - 12h)" : "Tarde (13h - 18h)";
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Agendar Consulta
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Defina data e horário confirmados para a recepção
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lead Summary Ribbon */}
      <div className="px-6 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold">{lead.nomeCompleto}</span>
          <span className="text-slate-400">•</span>
          <span className="font-mono">{formatPhone(lead.telefone)}</span>
        </div>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-100/60 dark:bg-emerald-900/40">
          {lead.procedimento}
        </span>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {lead.periodoPreferencia && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Preferência informada pelo paciente:{" "}
              <strong>
                {lead.periodoPreferencia === "MANHA"
                  ? "Manhã"
                  : lead.periodoPreferencia === "TARDE"
                  ? "Tarde"
                  : "Qualquer horário"}
              </strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              Data da Consulta
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Horário */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Horário ({getTurnoCalculado(horario)})
            </label>
            <input
              type="time"
              required
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Quick Time Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            Horários Frequentes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["08:30", "09:30", "10:30", "11:30", "14:00", "15:00", "16:00", "17:00"].map(
              (time) => (
                <button
                  type="button"
                  key={time}
                  onClick={() => setHorario(time)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                    horario === time
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {time}
                </button>
              )
            )}
          </div>
        </div>

        {/* Observações da Recepção */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações da Recepção
          </label>
          <textarea
            rows={3}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: Primeira consulta para avaliação. Paciente pediu para ser atendido pelo Dr. Carlos..."
            className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{isSaving ? "Salvando..." : "Confirmar Agendamento"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

