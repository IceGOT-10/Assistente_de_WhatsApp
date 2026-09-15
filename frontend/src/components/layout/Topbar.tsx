import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  Radio,
  WifiOff,
  Menu,
} from "lucide-react";
import type { ThemeMode } from "../../types/lead";
import { api } from "../../services/api";

interface TopbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  theme,
  onThemeChange,
  onOpenMobileMenu,
}) => {
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [clinicName, setClinicName] = useState<string>("OdontoPrime");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

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
      // Capitaliza a primeira letra do dia da semana
      const formatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
      setCurrentDateFormatted(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
            <span>Olá, Maria!</span>
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

        {/* Botão de Notificações com badge */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150"
          title="Notificações da recepção"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
        </button>
      </div>
    </header>
  );
};

