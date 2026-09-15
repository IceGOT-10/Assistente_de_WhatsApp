import React from "react";
import type { AppointmentItem } from "../../types/appointment";

interface WeeklyScheduleGridProps {
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
];

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  currentDate,
  appointments,
  onSelectAppointment,
}) => {
  // Calcula os 6 dias da semana (Segunda a Sábado) baseados na currentDate
  const getWeekDays = (baseDate: Date) => {
    const current = new Date(baseDate);
    const day = current.getDay(); // 0 = Domingo, 1 = Segunda...
    // Queremos começar na Segunda (1)
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diffToMonday));

    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDayHeader = (date: Date) => {
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
    const dayNum = date.getDate().toString().padStart(2, "0");
    return {
      weekday: weekday.toUpperCase().replace(".", ""),
      dayNum,
      dateString: date.toISOString().split("T")[0],
    };
  };

  // Cores suaves por procedimento
  const getProcedureColor = (proc: string, status: string) => {
    if (status === "CANCELADO") {
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900";
    }

    const lower = proc.toLowerCase();
    if (lower.includes("clareamento")) {
      return "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900";
    }
    if (lower.includes("siso") || lower.includes("extração") || lower.includes("canal")) {
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900";
    }
    if (lower.includes("faceta") || lower.includes("prótese") || lower.includes("implante")) {
      return "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 ease-in-out">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header dos Dias da Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            {/* Coluna vazia para alinhar com os horários */}
            <div className="p-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase border-r border-slate-100 dark:border-slate-800 text-center">
              Horário
            </div>

            {weekDays.map((d, idx) => {
              const { weekday, dayNum } = formatDayHeader(d);
              const active = isToday(d);

              return (
                <div
                  key={idx}
                  className={`p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 transition-colors duration-150 ${
                    active ? "bg-indigo-50/70 dark:bg-indigo-950/30" : ""
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wider">
                    {weekday}
                  </span>
                  <div className="mt-0.5 flex items-center justify-center gap-1">
                    <span
                      className={`text-base font-black ${
                        active
                          ? "w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {active && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase hidden sm:inline">
                        Hoje
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linhas da Grade de Horários (08:00 às 17:00) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {HOURS.map((hour) => {
              const hourNum = parseInt(hour.split(":")[0], 10);

              return (
                <div key={hour} className="grid grid-cols-7 min-h-[72px]">
                  {/* Coluna da Hora */}
                  <div className="p-2 border-r border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 text-center select-none">
                    {hour}
                  </div>

                  {/* Células de cada dia para este horário */}
                  {weekDays.map((day, dIdx) => {
                    const { dateString } = formatDayHeader(day);
                    const active = isToday(day);

                    // Filtra agendamentos nesta data e nesta faixa de hora
                    const matches = appointments.filter((apt) => {
                      const aptDate = apt.data;
                      const aptHour = parseInt(apt.horarioInicio.split(":")[0], 10);
                      return aptDate === dateString && aptHour === hourNum;
                    });

                    return (
                      <div
                        key={dIdx}
                        className={`p-1.5 border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative transition-colors duration-150 ${
                          active ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                        }`}
                      >
                        {matches.map((apt) => {
                          const colorClasses = getProcedureColor(apt.servico, apt.status);

                          return (
                            <div
                              key={apt.id}
                              onClick={() => onSelectAppointment(apt)}
                              className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.02] transition-all duration-150 mb-1 ${colorClasses}`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-bold opacity-85">
                                <span>{apt.horarioInicio} - {apt.horarioFim}</span>
                                {apt.status === "CONFIRMADO" && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                              </div>
                              <div className="font-bold truncate mt-0.5 text-slate-900 dark:text-white">
                                {apt.lead.nomeCompleto}
                              </div>
                              <div className="text-[11px] truncate opacity-90">
                                {apt.servico}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

