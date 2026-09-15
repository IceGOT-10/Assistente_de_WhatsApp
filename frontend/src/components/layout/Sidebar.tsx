import React from "react";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Bot,
  Stethoscope,
  X,
  Sparkles,
} from "lucide-react";
import type { NavigationTab } from "../../hooks/useNavigation";

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  unreadMessagesCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadMessagesCount = 0,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems = [
    {
      id: "inicio" as NavigationTab,
      label: "Início",
      icon: LayoutDashboard,
    },
    {
      id: "agenda" as NavigationTab,
      label: "Agenda",
      icon: Calendar,
    },
    {
      id: "atendimento" as NavigationTab,
      label: "Atendimento",
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      id: "clientes" as NavigationTab,
      label: "Clientes",
      icon: Users,
    },
    {
      id: "relatorios" as NavigationTab,
      label: "Relatórios",
      icon: BarChart3,
    },
    {
      id: "configuracoes" as NavigationTab,
      label: "Configurações",
      icon: Bot,
    },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Overlay Mobile com transição nativa */}
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200 ease-in-out ${
          isOpenMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar Drawer / Desktop Bar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Header da Sidebar: Logo & Nome Real da Clínica */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-950/40 shrink-0">
              <Stethoscope className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Odonto<span className="text-indigo-600 dark:text-indigo-400">Prime</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Gestão Clínica & IA</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer transition-colors duration-150"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navegação Principal
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all duration-200 ease-in-out cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 dark:bg-indigo-600 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? "scale-110 text-white" : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors duration-150 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé Fixo: Usuário / Atendente Conectada */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                MS
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                Maria Souza
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                Atendente / Recepção
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

