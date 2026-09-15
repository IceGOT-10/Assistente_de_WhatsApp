import React, { useState } from "react";
import { Search, MessageSquare, Bot, Clock, CheckCircle2 } from "lucide-react";
import type { ConversationSummary } from "../../types/chat";

interface ChatConversationListProps {
  conversations: ConversationSummary[];
  selectedTelefone: string | null;
  onSelectConversation: (telefone: string) => void;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({
  conversations,
  selectedTelefone,
  onSelectConversation,
}) => {
  const [activeFilter, setActiveFilter] = useState<"todas" | "naoLidas" | "ia" | "aguardando" | "resolvidas">("todas");
  const [search, setSearch] = useState("");

  // Contadores
  const counts = {
    todas: conversations.length,
    naoLidas: conversations.filter((c) => c.naoLidas > 0).length,
    ia: conversations.filter((c) => !c.iaPausada).length,
    aguardando: conversations.filter((c) => c.iaPausada).length,
    resolvidas: conversations.filter((c) => c.statusAba === "RESOLVIDA").length,
  };

  const filteredConversations = conversations.filter((c) => {
    // Filtro por aba
    if (activeFilter === "naoLidas" && c.naoLidas === 0) return false;
    if (activeFilter === "ia" && c.iaPausada) return false;
    if (activeFilter === "aguardando" && !c.iaPausada) return false;
    if (activeFilter === "resolvidas" && c.statusAba !== "RESOLVIDA") return false;

    // Filtro de busca
    if (search.trim()) {
      const term = search.toLowerCase();
      const nomeMatch = c.nome.toLowerCase().includes(term);
      const phoneMatch = c.telefone.includes(term.replace(/\D/g, ""));
      const msgMatch = c.ultimaMensagem.toLowerCase().includes(term);
      return nomeMatch || phoneMatch || msgMatch;
    }

    return true;
  });

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
      {/* Abas em Pílula com Contadores */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {[
            { key: "todas", label: "Todas", count: counts.todas, icon: MessageSquare },
            { key: "naoLidas", label: "Não lidas", count: counts.naoLidas, icon: null },
            { key: "ia", label: "IA", count: counts.ia, icon: Bot },
            { key: "aguardando", label: "Aguardando", count: counts.aguardando, icon: Clock },
            { key: "resolvidas", label: "Resolvidas", count: counts.resolvidas, icon: CheckCircle2 },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all duration-150 cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.icon && <tab.icon className="w-3 h-3" />}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Barra de Busca */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por contato ou mensagem..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma conversa encontrada neste filtro.
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isSelected = selectedTelefone === c.telefone;

            return (
              <div
                key={c.telefone}
                onClick={() => onSelectConversation(c.telefone)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {c.avatarInitials}
                  </div>
                  {c.iaPausada ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"
                      title="Atendimento transferido para humano"
                    />
                  ) : (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                      title="IA ativa no atendimento"
                    />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {c.nome}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {formatTime(c.ultimaInteracao)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                    {c.ultimaMensagem}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    {c.procedimento && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate">
                        {c.procedimento}
                      </span>
                    )}

                    {c.naoLidas > 0 && (
                      <span className="ml-auto text-[10px] font-black px-1.5 py-0.2 rounded-full bg-indigo-600 text-white">
                        {c.naoLidas}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

