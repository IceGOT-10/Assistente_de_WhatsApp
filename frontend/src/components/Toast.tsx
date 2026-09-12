import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { ToastMessage } from "../types/lead";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
            t.type === "success"
              ? "bg-emerald-950/90 text-emerald-100 border-emerald-800 shadow-emerald-950/20"
              : t.type === "error"
              ? "bg-rose-950/90 text-rose-100 border-rose-800 shadow-rose-950/20"
              : "bg-slate-900/90 text-slate-100 border-slate-700 shadow-slate-950/20"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {t.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            {t.type === "error" && (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            {t.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight">
              {t.title}
            </h4>
            {t.message && (
              <p className="text-xs text-slate-300 mt-1 leading-normal">
                {t.message}
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
