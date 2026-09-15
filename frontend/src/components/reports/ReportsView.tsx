import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarCheck,
  Sparkles,
  Download,
  Filter,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";
import type { Lead } from "../../types/lead";
import type { AppointmentItem } from "../../types/appointment";

type PeriodFilter = "hoje" | "7d" | "mes" | "todos";

export const ReportsView: React.FC = () => {
  const [period, setPeriod] = useState<PeriodFilter>("7d");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsData, apptsData] = await Promise.all([
        api.getLeads().catch(() => []),
        api.getAppointments().catch(() => []),
      ]);
      setLeads(leadsData);
      setAppointments(apptsData);
    } catch (err) {
      console.error("Erro ao carregar dados dos relatórios:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtra dados com base no período selecionado
  const { filteredLeads, filteredAppointments } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (period === "todos") {
      return { filteredLeads: leads, filteredAppointments: appointments };
    }

    if (period === "hoje") {
      const fLeads = leads.filter((l) => {
        const leadDate = new Date(l.createdAt).toISOString().split("T")[0];
        return leadDate === todayStr;
      });
      const fAppts = appointments.filter((a) => a.data === todayStr);
      return { filteredLeads: fLeads, filteredAppointments: fAppts };
    }

    if (period === "7d") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

      const fLeads = leads.filter((l) => {
        const leadDate = new Date(l.createdAt).toISOString().split("T")[0];
        return leadDate >= sevenDaysAgoStr;
      });
      const fAppts = appointments.filter((a) => a.data >= sevenDaysAgoStr);
      return { filteredLeads: fLeads, filteredAppointments: fAppts };
    }

    // "mes" (ano-mês atual)
    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"
    const fLeads = leads.filter((l) => {
      const leadDate = new Date(l.createdAt).toISOString().split("T")[0];
      return leadDate.startsWith(currentMonthStr);
    });
    const fAppts = appointments.filter((a) => a.data.startsWith(currentMonthStr));
    return { filteredLeads: fLeads, filteredAppointments: fAppts };
  }, [leads, appointments, period]);

  // Cálculos de Métricas
  const totalLeads = filteredLeads.length;
  const agendadosCount = filteredLeads.filter((l) => l.status === "AGENDADO").length;
  const transbordoCount = filteredLeads.filter((l) => l.status === "TRANSBORDO_HUMANO").length;

  const taxaConversao = totalLeads > 0 ? Math.round((agendadosCount / totalLeads) * 100) : 0;
  const taxaAutomacaoIA =
    totalLeads > 0
      ? Math.round(((totalLeads - transbordoCount) / totalLeads) * 100)
      : 100;

  // Distribuição de Consultas por Profissional
  const consultasPorProfissional = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAppointments.forEach((apt) => {
      const prof = apt.profissional || "Não atribuído";
      map[prof] = (map[prof] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredAppointments]);

  // Distribuição por Procedimento
  const consultasPorProcedimento = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAppointments.forEach((apt) => {
      const serv = apt.servico || "Consulta Geral";
      map[serv] = (map[serv] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredAppointments]);

  // Exportação para CSV
  const handleExportCSV = () => {
    if (filteredAppointments.length === 0 && filteredLeads.length === 0) {
      alert("Não há dados para exportar no período selecionado.");
      return;
    }

    const headers = ["Nome", "Telefone", "Status Lead", "Procedimento", "Profissional", "Data", "Horario"];
    const rows = filteredAppointments.map((apt) => [
      `"${apt.lead.nomeCompleto.replace(/"/g, '""')}"`,
      `"${apt.lead.telefone}"`,
      `"${apt.status}"`,
      `"${apt.servico.replace(/"/g, '""')}"`,
      `"${apt.profissional.replace(/"/g, '""')}"`,
      `"${apt.data}"`,
      `"${apt.horarioInicio} - ${apt.horarioFim}"`,
    ]);

    // Se houver leads sem consulta agendada, também os incluímos no relatório
    const leadsComConsulta = new Set(filteredAppointments.map((a) => a.leadId));
    filteredLeads
      .filter((l) => !leadsComConsulta.has(l.id))
      .forEach((l) => {
        rows.push([
          `"${l.nomeCompleto.replace(/"/g, '""')}"`,
          `"${l.telefone}"`,
          `"${l.status}"`,
          `"${(l.procedimento || "Não informado").replace(/"/g, '""')}"`,
          `"-"`,
          `"-"`,
          `"-"`,
        ]);
      });

    const csvContent =
      "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_odontoprime_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 transition-all duration-200 ease-in-out">
      {/* Top Banner do Relatório */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Relatórios e Métricas de Conversão
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desempenho operacional da recepção e taxa de conversão da IA Sofia.
              </p>
            </div>
          </div>

          {/* Filtros de Período e Ações */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPeriod("hoje")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === "hoje"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPeriod("7d")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === "7d"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => setPeriod("mes")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === "mes"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => setPeriod("todos")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === "todos"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Todos
              </button>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Métricas Principais */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold">Calculando métricas...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Card 1: Conversão */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Taxa de Conversão</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {taxaConversao}%
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {agendadosCount} de {totalLeads}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Leads convertidos em consultas marcadas
                </p>
              </div>

              {/* Card 2: Autonomia IA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Autonomia da IA Sofia</span>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                    {taxaAutomacaoIA}%
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    sem transbordo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Resolvidos 100% de forma automatizada
                </p>
              </div>

              {/* Card 3: Total de Leads no Período */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total de Leads</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalLeads}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pacientes triados no período selecionado
                </p>
              </div>

              {/* Card 4: Consultas Agendadas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Consultas Marcadas</span>
                  <CalendarCheck className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {filteredAppointments.length}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Horários reservados na clínica
                </p>
              </div>
            </div>

            {/* Funil Visual de Conversão */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Funil de Atendimento da Recepção
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1. Contatos Recebidos</span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {totalLeads}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full w-full" />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">2. Consultas Agendadas</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {agendadosCount}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${taxaConversao}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">3. Transbordo Humano</span>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {transbordoCount}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{
                        width: totalLeads > 0 ? `${(transbordoCount / totalLeads) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabelas de Distribuição: Por Profissional e Por Procedimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Distribuição por Profissional */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Consultas por Profissional
                </h4>
                {consultasPorProfissional.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhum agendamento no período.</p>
                ) : (
                  <div className="space-y-2.5">
                    {consultasPorProfissional.map(([prof, count]) => (
                      <div key={prof} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {prof}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {count} {count === 1 ? "consulta" : "consultas"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Distribuição por Procedimento */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Procedimentos mais Buscados
                </h4>
                {consultasPorProcedimento.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhum procedimento no período.</p>
                ) : (
                  <div className="space-y-2.5">
                    {consultasPorProcedimento.map(([serv, count]) => (
                      <div key={serv} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {serv}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {count} {count === 1 ? "caso" : "casos"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Banner Informativo de IA */}
            <div className="mt-6 p-4 rounded-2xl bg-linear-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                A assistente Sofia realizou atendimentos com respostas instantâneas, reduzindo o tempo médio de espera dos pacientes na recepção para menos de 5 segundos e garantindo uma conversão sustentável em consultas confirmadas.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
