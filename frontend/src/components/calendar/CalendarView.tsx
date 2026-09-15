import React, { useState, useEffect, useCallback } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import { WeeklyScheduleGrid } from "./WeeklyScheduleGrid";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { api } from "../../services/api";
import type { AppointmentItem, CreateAppointmentDTO } from "../../types/appointment";
import { Loader2 } from "lucide-react";

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "mes">("semana");
  const [selectedProfissional, setSelectedProfissional] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const carregarAgendamentos = useCallback(async () => {
    try {
      const data = await api.getAppointments({
        profissional: selectedProfissional !== "ALL" ? selectedProfissional : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
      });
      setAppointments(data);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfissional, selectedStatus]);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  // Navegação de Período
  const handlePrevPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Criação de Agendamento
  const handleCreateAppointment = async (dto: CreateAppointmentDTO) => {
    await api.createAppointment(dto);
    await carregarAgendamentos();
  };

  // Alteração de Status
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await api.updateAppointmentStatus(id, newStatus);
    setSelectedAppointment(null);
    await carregarAgendamentos();
  };

  return (
    <div className="space-y-5 transition-all duration-200 ease-in-out">
      {/* Barra de Ferramentas da Agenda */}
      <CalendarToolbar
        currentDate={currentDate}
        onPrevPeriod={handlePrevPeriod}
        onNextPeriod={handleNextPeriod}
        onToday={handleToday}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedProfissional={selectedProfissional}
        onProfissionalChange={setSelectedProfissional}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onOpenNewModal={() => setIsModalOpen(true)}
      />

      {/* Grade Semanal */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-semibold">Carregando horários da clínica...</span>
        </div>
      ) : (
        <WeeklyScheduleGrid
          currentDate={currentDate}
          appointments={appointments}
          onSelectAppointment={(apt) => setSelectedAppointment(apt)}
        />
      )}

      {/* Modal de Novo Agendamento */}
      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAppointment}
        initialDate={currentDate.toISOString().split("T")[0]}
      />

      {/* Modal de Detalhes Rápidos da Consulta */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Detalhes da Consulta
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {selectedAppointment.lead.nomeCompleto}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedAppointment.lead.telefone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-bold block text-slate-400 text-[10px] uppercase">Procedimento</span>
                <span>{selectedAppointment.servico}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-bold block text-slate-400 text-[10px] uppercase">Profissional</span>
                <span>{selectedAppointment.profissional}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-bold block text-slate-400 text-[10px] uppercase">Horário</span>
                <span>{selectedAppointment.data} ({selectedAppointment.horarioInicio} às {selectedAppointment.horarioFim})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              {selectedAppointment.status !== "CONFIRMADO" && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedAppointment.id, "CONFIRMADO")}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Confirmar presença
                </button>
              )}
              {selectedAppointment.status !== "CANCELADO" && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedAppointment.id, "CANCELADO")}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

