import React, { useState, useEffect, useCallback } from "react";
import { ChatConversationList } from "./ChatConversationList";
import { ChatWindow } from "./ChatWindow";
import { ChatCustomerSidebar } from "./ChatCustomerSidebar";
import { api } from "../../services/api";
import type { ConversationSummary, ChatMessage } from "../../types/chat";

interface ChatViewProps {
  onEditCustomer?: (leadId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onEditCustomer }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedTelefone, setSelectedTelefone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  // Carrega lista de conversas
  const carregarConversas = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (!selectedTelefone && data.length > 0) {
        setSelectedTelefone(data[0].telefone);
      }
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  }, [selectedTelefone]);

  // Carrega histórico de mensagens da conversa ativa
  const carregarMensagens = useCallback(async (telefone: string, isInitial = false) => {
    if (isInitial) setIsLoadingMessages(true);
    try {
      const data = await api.getMessages(telefone);
      setMessages(data);
      // Marca como lidas se houver mensagens pendentes
      await api.markMessagesRead(telefone);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      if (isInitial) setIsLoadingMessages(false);
    }
  }, []);

  // Efeito inicial para conversas
  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  // Quando o telefone selecionado muda, busca mensagens
  useEffect(() => {
    if (selectedTelefone) {
      carregarMensagens(selectedTelefone, true);
    }
  }, [selectedTelefone, carregarMensagens]);

  // Polling reativo curto (2.5 segundos) quando houver conversa aberta
  useEffect(() => {
    if (!selectedTelefone) return;

    const interval = setInterval(() => {
      carregarMensagens(selectedTelefone, false);
      carregarConversas();
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedTelefone, carregarMensagens, carregarConversas]);

  // Envio de mensagem pelo atendente
  const handleSendMessage = async (texto: string) => {
    if (!selectedTelefone) return;
    await api.sendMessage(selectedTelefone, texto);
    await carregarMensagens(selectedTelefone, false);
    await carregarConversas();
  };

  // Assumir atendimento (takeover)
  const handleTakeover = async () => {
    if (!selectedTelefone) return;
    await api.takeoverSession(selectedTelefone);
    await carregarMensagens(selectedTelefone, false);
    await carregarConversas();
  };

  const activeConversation = conversations.find((c) => c.telefone === selectedTelefone) || null;

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[580px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex transition-all duration-200 ease-in-out">
      {/* Coluna 1: Lista de Conversas (320px) */}
      <div className="w-80 shrink-0 h-full">
        <ChatConversationList
          conversations={conversations}
          selectedTelefone={selectedTelefone}
          onSelectConversation={(tel) => setSelectedTelefone(tel)}
        />
      </div>

      {/* Coluna 2: Chat Central */}
      <ChatWindow
        activeConversation={activeConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        onTakeover={handleTakeover}
        isLoading={isLoadingMessages}
      />

      {/* Coluna 3: Perfil Lateral do Cliente */}
      {activeConversation && (
        <div className="hidden xl:block shrink-0 h-full">
          <ChatCustomerSidebar
            conversation={activeConversation}
            onEditCustomer={() => {
              if (onEditCustomer && activeConversation) {
                onEditCustomer(activeConversation.telefone);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

