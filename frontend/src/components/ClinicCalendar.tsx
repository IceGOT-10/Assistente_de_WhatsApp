import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  CalendarCheck2,
  AlertCircle,
  Phone,
  HeartPulse,
} from "lucide-react";
import type { Lead, PeriodoPreferencia } from "../types/lead";
import { formatPhone, getInitials, getAvatarColor } from "../utils/formatters";

interface ClinicCalendarProps {
  leads: Lead[];
  onOpenDetails: (lead: Lead) => void;
  onOpenScheduleModal: (lead: Lead) => void;
}

type CalendarView = "week" | "month";

export const ClinicCalendar: React.FC<ClinicCalendarProps> = ({
  leads,
  onOpenDetails,
  onOpenScheduleModal,
}) => {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [turnoFilter, setTurnoFilter] = useState<"ALL" | "MANHA" | "TARDE">("ALL");

  // Filtra apenas leads que estão como AGENDADO
  const scheduledLeads = useMemo(() => {
    return leads.filter((l) => l.status === "AGENDADO");
  }, [leads]);

  // Leads agendados que ainda não têm data definida
  const unscheduledLeads = useMemo(() => {
    return scheduledLeads.filter((l) => !l.dataAgendamento);
  }, [scheduledLeads]);

  // Navegação de datas
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "week") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setMonth(next.getMonth() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "week") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Dias da semana atual (Segunda a Sábado)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0 = Domingo
    // Ajusta para segunda-feira como início
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Dias do mês atual (grade do mês)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Começando da segunda-feira
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Dias do mês anterior
    for (let i = startDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Dias do próximo mês para completar semanas (múltiplo de 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentDate]);

  // Formata data ISO para YYYY-MM-DD
  const formatIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Identifica se um horário pertence ao turno
  const getTurnoFromHora = (hora?: string | null, pref?: PeriodoPreferencia) => {
    if (hora) {
      const h = parseInt(hora.split(":")[0], 10);
      return h < 12 ? "MANHA" : "TARDE";
    }
    return pref || "MANHA";
  };

  // Busca leads para uma data e turno específicos
  const getLeadsForDay = (
    dateStr: string,
    turno?: "MANHA" | "TARDE"
  ): Lead[] => {
    return scheduledLeads.filter((l) => {
      if (l.dataAgendamento !== dateStr) return false;
      if (!turno) return true;
      const t = getTurnoFromHora(l.horarioAgendado, l.periodoPreferencia);
      return t === turno;
    });
  };

  // Header Title
  const formattedHeaderTitle = useMemo(() => {
    if (view === "week") {
      const first = weekDays[0];
      const last = weekDays[weekDays.length - 1];
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleDateString("pt-BR", {
          month: "long",
        })} de ${first.getFullYear()}`;
      }
      return `${first.toLocaleDateString("pt-BR", {
        month: "short",
      })} - ${last.toLocaleDateString("pt-BR", {
        month: "short",
      })} de ${first.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate, view, weekDays]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Aviso de Pacientes Agendados sem Data/Horário Definidos */}
      {unscheduledLeads.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {unscheduledLeads.length}{" "}
                {unscheduledLeads.length === 1
                  ? "paciente marcado como agendado precisa de horário"
                  : "pacientes marcados como agendados precisam de horário"}
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Defina data e horário no calendário para organizar a grade de
                atendimentos da clínica.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {unscheduledLeads.slice(0, 3).map((l) => (
              <button
                key={l.id}
                onClick={() => onOpenScheduleModal(l)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <CalendarCheck2 className="w-3.5 h-3.5" />
                <span>Definir: {l.nomeCompleto.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Ferramentas da Agenda */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors">
        {/* Navegação de Datas */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/70 dark:border-slate-700">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-black text-slate-900 dark:text-slate-100 capitalize tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{formattedHeaderTitle}</span>
          </h2>
        </div>

        {/* Alternador de Visualização & Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro de Turno */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <button
              onClick={() => setTurnoFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                turnoFilter === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Todos os Turnos
            </button>
            <button
              onClick={() => setTurnoFilter("MANHA")}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                turnoFilter === "MANHA"
                  ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Manhã</span>
            </button>
            <button
              onClick={() => setTurnoFilter("TARDE")}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                turnoFilter === "TARDE"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Tarde</span>
            </button>
          </div>

          {/* Toggle Semana / Mês */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                view === "week"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                view === "month"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      {/* VISÃO SEMANAL: GRADE DE TURNOS (MANHÃ E TARDE) */}
      {view === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {weekDays.map((day) => {
            const dateStr = formatIsoDate(day);
            const hoje = isToday(day);
            const leadsManha = getLeadsForDay(dateStr, "MANHA");
            const leadsTarde = getLeadsForDay(dateStr, "TARDE");
            const totalDia = leadsManha.length + leadsTarde.length;

            return (
              <div
                key={dateStr}
                className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 min-h-[480px] shadow-xs overflow-hidden ${
                  hoje
                    ? "border-emerald-500/80 dark:border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200/90 dark:border-slate-800"
                }`}
              >
                {/* Cabeçalho do Dia */}
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    hoje
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-slate-50/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider block ${
                        hoje
                          ? "text-emerald-100"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </span>
                    <span className="text-sm font-extrabold tracking-tight">
                      {day.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hoje
                        ? "bg-white text-emerald-700"
                        : "bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {totalDia} {totalDia === 1 ? "consulta" : "consultas"}
                  </span>
                </div>

                {/* Grade dos Turnos */}
                <div className="flex-1 p-2.5 flex flex-col gap-3 overflow-y-auto max-h-[620px]">
                  {/* Bloco Manhã (08h - 12h) */}
                  {(turnoFilter === "ALL" || turnoFilter === "MANHA") && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Manhã (08h - 12h)</span>
                        <span className="ml-auto text-[10px] font-mono opacity-80">
                          {leadsManha.length}
                        </span>
                      </div>

                      {leadsManha.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-800/20 text-[11px] text-slate-400 dark:text-slate-500">
                          Horários livres
                        </div>
                      ) : (
                        leadsManha.map((lead) => (
                          <AppointmentCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => onOpenDetails(lead)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Bloco Tarde (13h - 18h) */}
                  {(turnoFilter === "ALL" || turnoFilter === "TARDE") && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span>Tarde (13h - 18h)</span>
                        <span className="ml-auto text-[10px] font-mono opacity-80">
                          {leadsTarde.length}
                        </span>
                      </div>

                      {leadsTarde.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-800/20 text-[11px] text-slate-400 dark:text-slate-500">
                          Horários livres
                        </div>
                      ) : (
                        leadsTarde.map((lead) => (
                          <AppointmentCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => onOpenDetails(lead)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISÃO MENSAL: GRADE COMPACTA */}
      {view === "month" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          {/* Header dos Dias da Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-600 dark:text-slate-300 py-2.5">
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Grade de Dias */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {monthDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatIsoDate(date);
              const hoje = isToday(date);
              const dayLeads = scheduledLeads.filter(
                (l) => l.dataAgendamento === dateStr
              );

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                    !isCurrentMonth
                      ? "bg-slate-50/50 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  } ${hoje ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        hoje
                          ? "bg-emerald-600 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {dayLeads.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded">
                        {dayLeads.length}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {dayLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => onOpenDetails(lead)}
                        className="w-full text-left p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-900 dark:text-emerald-200">
                          <span className="truncate">
                            {lead.horarioAgendado || "Hora a def."}
                          </span>
                          <span className="text-[9px] text-emerald-700 dark:text-emerald-400">
                            {lead.tipoAtendimento === "CONVENIO" ? "Conv." : "Part."}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          {lead.nomeCompleto}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponente Card de Consulta Agendada (Visão Semanal)
interface AppointmentCardProps {
  lead: Lead;
  onClick: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ lead, onClick }) => {
  const avatarBg = getAvatarColor(lead.nomeCompleto);

  return (
    <div
      onClick={onClick}
      className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none"
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border shrink-0 ${avatarBg}`}
          >
            {getInitials(lead.nomeCompleto)}
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {lead.nomeCompleto}
          </span>
        </div>

        {lead.horarioAgendado && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 font-mono">
            {lead.horarioAgendado}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 truncate mb-1">
        <HeartPulse className="w-3 h-3 text-indigo-500 shrink-0" />
        <span className="truncate">{lead.procedimento}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
        <span className="flex items-center gap-1 font-mono">
          <Phone className="w-2.5 h-2.5 text-emerald-600" />
          {formatPhone(lead.telefone).slice(0, 14)}
        </span>
        <span
          className={`font-semibold uppercase tracking-wider ${
            lead.tipoAtendimento === "PARTICULAR"
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {lead.tipoAtendimento}
        </span>
      </div>
    </div>
  );
};
