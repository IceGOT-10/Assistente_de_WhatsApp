import React, { useState, useEffect } from "react";
import { X, Calendar, User, Phone, Stethoscope } from "lucide-react";
import type { CreateAppointmentDTO, ProfessionalItem } from "../../types/appointment";
import { api } from "../../services/api";

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAppointmentDTO) => Promise<void>;
  initialDate?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
}) => {
  const todayStr = initialDate || new Date().toISOString().split("T")[0];

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [procedimento, setProcedimento] = useState("Limpeza e Profilaxia");
  const [tipoAtendimento, setTipoAtendimento] = useState<"PARTICULAR" | "CONVENIO">("PARTICULAR");
  const [nomeConvenio, setNomeConvenio] = useState("");
  const [data, setData] = useState(todayStr);
  const [horarioInicio, setHorarioInicio] = useState("09:00");
  const [horarioFim, setHorarioFim] = useState("10:00");
  const [profissional, setProfissional] = useState("Dra. Camila Duarte");
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getProfessionals().then((list) => {
        setProfessionals(list);
        if (list.length > 0) {
          setProfissional(list[0].nome);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto || !telefone || !procedimento || !data) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        nomeCompleto,
        telefone,
        procedimento,
        tipoAtendimento,
        nomeConvenio: tipoAtendimento === "CONVENIO" ? nomeConvenio : null,
        data,
        horarioInicio,
        horarioFim,
        profissional,
        observacoes: observacoes || null,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-200 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Novo Agendamento
              </h2>
              <p className="text-xs text-slate-400">Preencha os dados da consulta clínica</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nome do Paciente */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Nome Completo do Paciente *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Telefone WhatsApp *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (89) 99436-5037"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Modalidade (Particular / Convênio) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Tipo de Atendimento
              </label>
              <select
                value={tipoAtendimento}
                onChange={(e) => setTipoAtendimento(e.target.value as any)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="PARTICULAR">Particular</option>
                <option value="CONVENIO">Convênio</option>
              </select>
            </div>

            {tipoAtendimento === "CONVENIO" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Nome do Convênio
                </label>
                <input
                  type="text"
                  value={nomeConvenio}
                  onChange={(e) => setNomeConvenio(e.target.value)}
                  placeholder="Ex: Sul América, Bradesco"
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Procedimento e Profissional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Procedimento / Serviço *
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  placeholder="Ex: Clareamento Dental"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Profissional *
              </label>
              <select
                value={profissional}
                onChange={(e) => setProfissional(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {professionals.length > 0 ? (
                  professionals.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome} {p.especialidade ? `(${p.especialidade})` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Dra. Camila Duarte">Dra. Camila Duarte</option>
                    <option value="Dr. Lucas Ramos">Dr. Lucas Ramos</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Data e Faixa Horária */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Horário Início
              </label>
              <select
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Horário Fim
              </label>
              <select
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Observações Clínicas
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Paciente com sensibilidade..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Rodapé com Ações */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Confirmar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
