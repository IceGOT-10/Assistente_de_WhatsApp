import React from "react";
import type { AppointmentItem } from "../../types/appointment";

interface MonthlyScheduleGridProps {
  currentDate: Date;
  appointments: AppointmentItem[];
  onSelectAppointment: (apt: AppointmentItem) => void;
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const MonthlyScheduleGrid: React.FC<MonthlyScheduleGridProps> = ({
  currentDate,
  appointments,
  onSelectAppointment,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Mês e ano formatados
  const monthTitle = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Dias do mês atual
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Dia da semana do 1º dia (0 = Dom, 1 = Seg ... 6 = Sáb)
  // Ajuste para começar em Segunda (0 = Seg ... 6 = Dom)
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;

  // Dias do mês anterior para preencher a primeira semana
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: { dayNum: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    prevMonthDays.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr: prevDate.toISOString().split("T")[0],
    });
  }

  // Dias do mês atual
  const currentMonthDays: { dayNum: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curDate = new Date(year, month, d);
    // Usar data local para evitar fuso horário
    const yStr = curDate.getFullYear();
    const mStr = String(curDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(curDate.getDate()).padStart(2, "0");
    currentMonthDays.push({
      dayNum: d,
      isCurrentMonth: true,
      dateStr: `${yStr}-${mStr}-${dStr}`,
    });
  }

  // Dias do próximo mês para fechar a grade (múltiplo de 7)
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  const nextMonthDays: { dayNum: number; isCurrentMonth: boolean; dateStr: string }[] = [];
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    nextMonthDays.push({
      dayNum: d,
      isCurrentMonth: false,
      dateStr: nextDate.toISOString().split("T")[0],
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const isToday = (dateStr: string) => {
    const today = new Date();
    const yStr = today.getFullYear();
    const mStr = String(today.getMonth() + 1).padStart(2, "0");
    const dStr = String(today.getDate()).padStart(2, "0");
    return dateStr === `${yStr}-${mStr}-${dStr}`;
  };

  const getProcedureColor = (proc: string, status: string) => {
    if (status === "CANCELADO") {
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900";
    }
    const lower = proc.toLowerCase();
    if (lower.includes("clareamento")) {
      return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900";
    }
    if (lower.includes("siso") || lower.includes("extração") || lower.includes("canal")) {
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
    }
    if (lower.includes("faceta") || lower.includes("prótese") || lower.includes("implante")) {
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900";
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 ease-in-out">
      {/* Header do Mês */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
        <span className="capitalize font-black text-slate-800 dark:text-slate-100 text-base">
          {monthTitle}
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total no período: <span className="font-bold text-slate-700 dark:text-slate-200">{appointments.length}</span> agendamento(s)
        </span>
      </div>

      {/* Cabeçalho dos Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="p-2.5 text-center text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 last:border-r-0"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Grade de Dias do Mês */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
        {allCalendarDays.map((cell, idx) => {
          const active = isToday(cell.dateStr);
          const cellAppointments = appointments.filter((apt) => apt.data === cell.dateStr);

          return (
            <div
              key={idx}
              className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                !cell.isCurrentMonth
                  ? "bg-slate-50/30 dark:bg-slate-900/20 opacity-40"
                  : active
                  ? "bg-indigo-50/20 dark:bg-indigo-950/15"
                  : "bg-white dark:bg-slate-900 hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
              }`}
            >
              {/* Número do Dia */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-black ${
                    active
                      ? "w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {cell.dayNum}
                </span>
                {cellAppointments.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {cellAppointments.length} {cellAppointments.length === 1 ? "cons." : "cons."}
                  </span>
                )}
              </div>

              {/* Lista de Consultas do Dia */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {cellAppointments.slice(0, 2).map((apt) => {
                  const colorClasses = getProcedureColor(apt.servico, apt.status);

                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAppointment(apt);
                      }}
                      className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold truncate cursor-pointer hover:scale-[1.02] transition-transform ${colorClasses}`}
                      title={`${apt.horarioInicio} - ${apt.lead.nomeCompleto} (${apt.servico})`}
                    >
                      <span className="font-bold mr-1">{apt.horarioInicio}</span>
                      {apt.lead.nomeCompleto}
                    </div>
                  );
                })}

                {cellAppointments.length > 2 && (
                  <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 pl-1">
                    +{cellAppointments.length - 2} mais
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

