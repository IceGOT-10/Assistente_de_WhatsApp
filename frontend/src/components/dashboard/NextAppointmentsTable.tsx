import React from "react";
import { ArrowRight, Clock, CalendarX2 } from "lucide-react";
import type { UpcomingAppointment } from "../../types/dashboard";

interface NextAppointmentsTableProps {
  appointments: UpcomingAppointment[];
  onNavigateToAgenda: () => void;
  isLoading?: boolean;
}

export const NextAppointmentsTable: React.FC<NextAppointmentsTableProps> = ({
  appointments,
  onNavigateToAgenda,
  isLoading = false,
}) => {
  const getStatusBadge = (status: UpcomingAppointment["status"]) => {
    switch (status) {
      case "CONFIRMADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmado
          </span>
        );
      case "AGUARDANDO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Aguardando
          </span>
        );
      case "CANCELADO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelado
          </span>
        );
      case "CONCLUIDO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Concluído
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all duration-200 ease-in-out flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Próximos atendimentos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consultas agendadas para o dia de hoje
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAgenda}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150 cursor-pointer group"
        >
          <span>Ver agenda completa</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>

      {/* Tabela de Atendimentos */}
      <div className="flex-1 overflow-x-auto mt-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
            <span className="animate-spin mb-2">⏳</span>
            <span>Carregando atendimentos...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <CalendarX2 className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nenhum atendimento agendado para hoje
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Novas consultas marcadas pela IA ou recepção aparecerão aqui.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-2">Horário</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Serviço</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150 group"
                >
                  {/* Horário */}
                  <td className="py-3.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.horario}</span>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5 min-w-[140px]">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                        {getInitials(apt.cliente.nome)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                          {apt.cliente.nome}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {apt.cliente.convenio ? `Convênio: ${apt.cliente.convenio}` : "Particular"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Serviço / Procedimento */}
                  <td className="py-3.5 px-3">
                    <div className="min-w-[130px]">
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">
                        {apt.servico}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {apt.profissional}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-2 text-right whitespace-nowrap">
                    {getStatusBadge(apt.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

