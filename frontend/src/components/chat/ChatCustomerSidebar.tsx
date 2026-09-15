import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  UserCog,
  Save,
  Check,
  FileText,
  Calendar,
} from "lucide-react";
import type { ConversationSummary } from "../../types/chat";

interface ChatCustomerSidebarProps {
  conversation: ConversationSummary | null;
  onEditCustomer: () => void;
  onSchedule?: () => void;
  onSaveNotes?: (notes: string) => Promise<void>;
}

export const ChatCustomerSidebar: React.FC<ChatCustomerSidebarProps> = ({
  conversation,
  onEditCustomer,
  onSchedule,
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState(() => conversation?.observacoes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setNotes(conversation?.observacoes || "");
  }, [conversation?.telefone, conversation?.observacoes]);

  if (!conversation) return null;

  const cleanPhone = conversation.telefone.replace(/\D/g, "");
  const waLink = `https://wa.me/55${cleanPhone}`;

  const handleSaveNotes = async () => {
    if (!onSaveNotes) return;
    setIsSaving(true);
    try {
      await onSaveNotes(notes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 flex flex-col h-full overflow-y-auto p-5 space-y-5">
      {/* Perfil do Paciente */}
      <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center font-black text-xl shadow-md mb-3">
          {conversation.avatarInitials}
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
          {conversation.nome}
        </h3>
        <p className="text-xs text-slate-400 font-medium">{conversation.telefone}</p>

        {/* Botão Atalho WhatsApp */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
        >
          <span>Ver no WhatsApp</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Dados Clínicos & Procedimento */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Dados do Atendimento
        </h4>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Procedimento</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {conversation.procedimento || "Não especificado"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Modalidade</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {conversation.tipoAtendimento || "Particular"}
            </span>
          </div>
        </div>
      </div>

      {/* Observações Clínicas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Observações</span>
          </h4>
          {savedSuccess && (
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Salvo!
            </span>
          )}
        </div>

        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações internas sobre o paciente..."
          className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={isSaving || !notes.trim()}
          className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar notas</span>
        </button>
      </div>

      {/* Ações Rápidas de Atendimento */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={onSchedule}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>+ Agendar Consulta</span>
        </button>

        <button
          type="button"
          onClick={onEditCustomer}
          className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <UserCog className="w-4 h-4" />
          <span>Editar dados completos</span>
        </button>
      </div>
    </div>
  );
};
