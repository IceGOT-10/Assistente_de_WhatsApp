import React, { useState, useEffect, useCallback } from "react";
import { ChatConversationList } from "./ChatConversationList";
import { ChatWindow } from "./ChatWindow";
import { ChatCustomerSidebar } from "./ChatCustomerSidebar";
import { api } from "../../services/api";
import type { ConversationSummary, ChatMessage } from "../../types/chat";

interface ChatViewProps {
  onEditCustomer?: (leadId: string) => void;
  onScheduleCustomer?: (leadData: any) => void;
  onNotification?: (type: "success" | "error" | "info", title: string, message: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onEditCustomer,
  onScheduleCustomer,
  onNotification,
}) => {
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
    try {
      await api.takeoverSession(selectedTelefone);
      await carregarMensagens(selectedTelefone, false);
      await carregarConversas();
      onNotification?.("info", "Atendimento Assumido", "A IA Sofia foi pausada e o atendimento manual está ativo.");
    } catch (error) {
      console.error("Erro ao assumir atendimento:", error);
      onNotification?.("error", "Erro ao pausar IA", "Não foi possível pausar a IA Sofia.");
    }
  };

  // Retomar atendimento pela IA Sofia
  const handleResume = async () => {
    if (!selectedTelefone) return;
    try {
      await api.resumeSession(selectedTelefone);
      await carregarMensagens(selectedTelefone, false);
      await carregarConversas();
      onNotification?.("success", "IA Sofia Reativada", "A assistente de IA Sofia reassumiu o atendimento deste paciente.");
    } catch (error) {
      console.error("Erro ao retomar IA:", error);
      onNotification?.("error", "Erro ao reativar IA", "Não foi possível devolver o atendimento para a IA.");
    }
  };

  const activeConversation = conversations.find((c) => c.telefone === selectedTelefone) || null;

  // Salvar notas clínicas com persistência no banco
  const handleSaveNotes = async (notes: string) => {
    if (!activeConversation) return;
    const cleanTel = activeConversation.telefone.replace(/\D/g, "");

    try {
      const leads = await api.getLeads();
      const lead = leads.find((l) => l.telefone.replace(/\D/g, "") === cleanTel);

      if (lead) {
        await api.updateLead(lead.id, { observacoes: notes });
      } else {
        await api.createCustomer({
          nomeCompleto: activeConversation.nome,
          telefone: cleanTel,
          observacoes: notes,
        });
      }

      await carregarConversas();
    } catch (err) {
      console.error("Erro ao salvar observações do paciente:", err);
      throw err;
    }
  };

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
        onResume={handleResume}
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
            onSchedule={() => {
              if (activeConversation && onScheduleCustomer) {
                onScheduleCustomer({
                  id: activeConversation.leadId,
                  nomeCompleto: activeConversation.nome,
                  telefone: activeConversation.telefone,
                  procedimento: activeConversation.procedimento || "Avaliação Geral",
                  tipoAtendimento: activeConversation.tipoAtendimento || "PARTICULAR",
                  nomeConvenio: null,
                });
              }
            }}
            onSaveNotes={handleSaveNotes}
          />
        </div>
      )}
    </div>
  );
};

