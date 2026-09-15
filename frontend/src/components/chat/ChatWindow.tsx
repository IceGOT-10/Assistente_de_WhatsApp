import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  UserCheck,
  User,
  Paperclip,
  CheckCheck,
} from "lucide-react";
import type { ChatMessage, ConversationSummary } from "../../types/chat";

interface ChatWindowProps {
  activeConversation: ConversationSummary | null;
  messages: ChatMessage[];
  onSendMessage: (texto: string) => Promise<void>;
  onTakeover: () => Promise<void>;
  isLoading?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  activeConversation,
  messages,
  onSendMessage,
  onTakeover,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/40 text-center text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
          <Bot className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Nenhuma conversa selecionada
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Escolha um paciente na lista lateral para visualizar as mensagens trocadas no WhatsApp e intervir em tempo real.
        </p>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      await onSendMessage(text);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeoverClick = async () => {
    setIsTakingOver(true);
    try {
      await onTakeover();
    } catch (error) {
      console.error("Erro no transbordo humano:", error);
    } finally {
      setIsTakingOver(false);
    }
  };

  const formatMessageTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/40">
      {/* Header do Chat */}
      <div className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {activeConversation.avatarInitials}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
              {activeConversation.nome}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{activeConversation.telefone}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {activeConversation.iaPausada ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    IA Pausada (Atendente)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    IA Sofia Ativa
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Botão Assumir Atendimento */}
        {!activeConversation.iaPausada && (
          <button
            type="button"
            onClick={handleTakeoverClick}
            disabled={isTakingOver}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isTakingOver ? "Pausando IA..." : "Assumir atendimento"}</span>
          </button>
        )}
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Carregando mensagens do WhatsApp...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Nenhuma mensagem anterior com este contato.
          </div>
        ) : (
          messages.map((msg) => {
            const isPatient = msg.remetente === "PACIENTE";
            const isAi = msg.remetente === "IA";
            const isAgent = msg.remetente === "ATENDENTE";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPatient ? "items-start" : "items-end"}`}
              >
                {/* Balão de Mensagem */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs shadow-xs transition-all duration-150 ${
                    isPatient
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/70 dark:border-slate-700/70"
                      : isAi
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100 rounded-tr-xs border border-indigo-200/70 dark:border-indigo-800/70"
                      : "bg-emerald-600 text-white rounded-tr-xs shadow-md shadow-emerald-500/20"
                  }`}
                >
                  {/* Identificação de Remetente */}
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold opacity-75">
                    {isPatient && (
                      <>
                        <User className="w-3 h-3" />
                        <span>{activeConversation.nome}</span>
                      </>
                    )}
                    {isAi && (
                      <>
                        <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-indigo-600 dark:text-indigo-400">Sofia • Assistente IA</span>
                      </>
                    )}
                    {isAgent && (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Recepção (Atendente)</span>
                      </>
                    )}
                  </div>

                  {/* Texto da Mensagem */}
                  <p className="whitespace-pre-wrap leading-relaxed font-medium">
                    {msg.texto}
                  </p>

                  {/* Horário e Check de Leitura */}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isAgent ? "text-emerald-100" : "text-slate-400 dark:text-slate-400"
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {!isPatient && <CheckCheck className="w-3 h-3 text-sky-400" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Envio Inferior */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Anexar arquivo ou imagem"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeConversation.iaPausada
                ? "Digite uma mensagem como atendente humano (Enter para enviar)..."
                : "Digite para responder (a IA será pausada automaticamente)..."
            }
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
