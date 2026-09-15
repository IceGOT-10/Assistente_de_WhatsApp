import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  Radio,
  WifiOff,
  Menu,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import type { ThemeMode } from "../../types/lead";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export interface NotificationItem {
  id: string;
  tipo: "transbordo" | "agendamento";
  titulo: string;
  descricao: string;
  horario: string;
  targetTab: "inicio" | "agenda" | "atendimento" | "clientes" | "relatorios";
}

interface TopbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenMobileMenu: () => void;
  onNavigateTab?: (tab: "inicio" | "agenda" | "atendimento" | "clientes" | "relatorios") => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  theme,
  onThemeChange,
  onOpenMobileMenu,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const primeiroNome = user?.nome ? user.nome.trim().split(" ")[0] : "Operador";
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [clinicName, setClinicName] = useState<string>("OdontoPrime");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  // Estado de Notificações
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Polling reativo em GET /api/health a cada 5 segundos
  useEffect(() => {
    let isMounted = true;

    const checkServerHealth = async () => {
      try {
        const res = await api.checkHealth();
        if (isMounted) {
          setIsServerOnline(true);
          if (res?.clinic) {
            setClinicName(res.clinic);
          }
        }
      } catch {
        if (isMounted) {
          setIsServerOnline(false);
        }
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Busca e sincronização de notificações reais (Leads em Transbordo + Consultas de Hoje)
  useEffect(() => {
    let isMounted = true;

    const carregarNotificacoes = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const [leads, appointments] = await Promise.all([
          api.getLeads().catch(() => []),
          api.getAppointments().catch(() => []),
        ]);

        if (!isMounted) return;

        const notifs: NotificationItem[] = [];

        // 1. Leads aguardando transbordo humano
        const transbordoLeads = leads.filter((l) => l.status === "TRANSBORDO_HUMANO");
        transbordoLeads.forEach((lead) => {
          notifs.push({
            id: `lead-${lead.id}`,
            tipo: "transbordo",
            titulo: "Atendimento Humano Necessário",
            descricao: `${lead.nomeCompleto} aguarda retorno da recepção.`,
            horario: "Aguardando",
            targetTab: "atendimento",
          });
        });

        // 2. Consultas do dia de hoje (não canceladas)
        const todayAppointments = appointments.filter(
          (apt) => apt.data === todayStr && apt.status !== "CANCELADO"
        );
        todayAppointments.forEach((apt) => {
          notifs.push({
            id: `apt-${apt.id}`,
            tipo: "agendamento",
            titulo: `Consulta Hoje • ${apt.horarioInicio}`,
            descricao: `${apt.lead.nomeCompleto} - ${apt.servico} (${apt.profissional})`,
            horario: apt.horarioInicio,
            targetTab: "agenda",
          });
        });

        setNotifications(notifs);
      } catch (err) {
        console.error("Erro ao carregar notificações do sistema:", err);
      }
    };

    carregarNotificacoes();
    const interval = setInterval(carregarNotificacoes, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Relógio e Data por Extenso em tempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      const rawDate = now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const formatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
      setCurrentDateFormatted(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const handleMarkAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setReadIds((prev) => new Set([...prev, item.id]));
    setIsDropdownOpen(false);
    if (onNavigateTab) {
      onNavigateTab(item.targetTab);
    }
  };

  return (
    <header className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200 ease-in-out px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Lado Esquerdo: Botão Mobile + Saudação e Data */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer transition-colors duration-150"
          title="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <span>Olá, {primeiroNome}!</span>
            <span className="text-base inline-block hover:scale-125 transition-transform duration-200 cursor-default">
              👋
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            {currentDateFormatted || "Carregando data..."} • {currentTime}
          </p>
        </div>
      </div>

      {/* Lado Direito: Status Conexão, Seletor de Tema & Notificações */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Indicador Reativo de Saúde do Servidor & IA */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ease-in-out ${
            isServerOnline
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/80 text-rose-800 dark:text-rose-300"
          }`}
          title={isServerOnline ? `Servidor e IA Online (${clinicName})` : "Servidor desconectado"}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isServerOnline ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isServerOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>

          <span className="hidden md:inline-flex items-center gap-1.5 font-bold">
            {isServerOnline ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>IA & Servidor: Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Servidor: Offline</span>
              </>
            )}
          </span>
        </div>

        {/* Seletor Triplo de Tema: Claro / Escuro / Sistema */}
        <div
          className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs transition-colors duration-150"
          title="Seletor de tema visual"
        >
          <button
            type="button"
            onClick={() => onThemeChange("light")}
            className={`p-1.5 rounded-lg transition-all duration-200 ease-in-out cursor-pointer ${
              theme === "light"
                ? "bg-white text-amber-500 shadow-xs scale-105 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Tema Claro"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("dark")}
            className={`p-1.5 rounded-lg transition-all duration-200 ease-in-out cursor-pointer ${
              theme === "dark"
                ? "bg-slate-700 text-indigo-300 shadow-xs scale-105 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Tema Escuro"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("system")}
            className={`p-1.5 rounded-lg transition-all duration-200 ease-in-out cursor-pointer ${
              theme === "system"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs scale-105 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Automático (Tema do Sistema)"
          >
            <Laptop className="w-4 h-4" />
          </button>
        </div>

        {/* Botão e Popover de Notificações */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150"
            title="Notificações da recepção"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header do Popover */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Notificações
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar lidas
                  </button>
                )}
              </div>

              {/* Lista de Alertas */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-xs font-semibold">Tudo tranquilo por aqui!</p>
                    <p className="text-[11px] mt-0.5 opacity-75">Nenhum alerta pendente no momento.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = readIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          isRead
                            ? "bg-white dark:bg-slate-900 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            : "bg-indigo-50/25 dark:bg-indigo-950/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            item.tipo === "transbordo"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300"
                              : "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300"
                          }`}
                        >
                          {item.tipo === "transbordo" ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <CalendarIcon className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.titulo}
                            </h4>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {item.horario}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.descricao}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                            Ver {item.targetTab === "atendimento" ? "no chat" : "na agenda"}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>

                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
