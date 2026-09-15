import React from "react";
import type { AppointmentItem } from "../../types/appointment";
import { Clock, User, Phone, CheckCircle2, XCircle } from "lucide-react";

interface DailyScheduleGridProps {
  currentDate: Date;
  appointments: AppointmentItem[];
  onSelectAppointment: (apt: AppointmentItem) => void;
}

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export const DailyScheduleGrid: React.FC<DailyScheduleGridProps> = ({
  currentDate,
  appointments,
  onSelectAppointment,
}) => {
  const dateString = currentDate.toISOString().split("T")[0];
  const isToday = () => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const dayTitle = currentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dayAppointments = appointments.filter((apt) => apt.data === dateString);

  const getProcedureColor = (proc: string, status: string) => {
    if (status === "CANCELADO") {
      return "bg-rose-50/70 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300";
    }
    const lower = proc.toLowerCase();
    if (lower.includes("clareamento")) {
      return "bg-sky-50/70 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-300";
    }
    if (lower.includes("siso") || lower.includes("extração") || lower.includes("canal")) {
      return "bg-amber-50/70 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300";
    }
    if (lower.includes("faceta") || lower.includes("prótese") || lower.includes("implante")) {
      return "bg-purple-50/70 border-purple-200 text-purple-800 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-300";
    }
    return "bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 ease-in-out">
      {/* Header do Dia */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="capitalize font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg">
            {dayTitle}
          </span>
          {isToday() && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 uppercase tracking-wide">
              Hoje
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total: <span className="font-bold text-slate-700 dark:text-slate-200">{dayAppointments.length}</span> consulta(s)
        </div>
      </div>

      {/* Lista de Horários do Dia */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {HOURS.map((hour) => {
          const hourNum = parseInt(hour.split(":")[0], 10);
          const hourAppointments = dayAppointments.filter((apt) => {
            const aptHour = parseInt(apt.horarioInicio.split(":")[0], 10);
            return aptHour === hourNum;
          });

          return (
            <div key={hour} className="grid grid-cols-12 min-h-[76px] hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
              {/* Coluna da Hora */}
              <div className="col-span-2 sm:col-span-1 p-3 border-r border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 text-center select-none flex items-start justify-center">
                <span className="mt-1">{hour}</span>
              </div>

              {/* Coluna de Consultas */}
              <div className="col-span-10 sm:col-span-11 p-2 space-y-2">
                {hourAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {hourAppointments.map((apt) => {
                      const colorClass = getProcedureColor(apt.servico, apt.status);

                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className={`p-3 rounded-xl border cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.01] transition-all duration-150 ${colorClass}`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                            <span className="flex items-center gap-1 opacity-90">
                              <Clock className="w-3 h-3" />
                              {apt.horarioInicio} - {apt.horarioFim}
                            </span>
                            {apt.status === "CONFIRMADO" && (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Confirmado
                              </span>
                            )}
                            {apt.status === "CANCELADO" && (
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                                <XCircle className="w-3 h-3" /> Cancelado
                              </span>
                            )}
                          </div>

                          <div className="mt-1 font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                            {apt.lead.nomeCompleto}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-90">
                            <span className="font-semibold">{apt.servico}</span>
                            <span className="text-[10px] opacity-70">• {apt.profissional}</span>
                          </div>

                          {apt.lead.telefone && (
                            <div className="mt-1 text-[10px] opacity-75 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {apt.lead.telefone}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center text-[11px] text-slate-300 dark:text-slate-700 italic pl-2 select-none">
                    Nenhum agendamento
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

