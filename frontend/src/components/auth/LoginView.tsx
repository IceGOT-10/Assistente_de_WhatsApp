import React, { useState } from "react";
import {
  Stethoscope,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@odontoprime.com.br");
  const [password, setPassword] = useState("admin123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error("Erro no login:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Não foi possível autenticar. Verifique seus dados.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-md w-full space-y-6">
        {/* Card Principal de Login */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 space-y-6">
          {/* Logo & Título */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-sky-500 items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-8 ring-indigo-50 dark:ring-indigo-950/50">
              <Stethoscope className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
                <span>Odonto</span>
                <span className="text-indigo-600 dark:text-indigo-400">Prime</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Acesso Seguro ao Painel Clínico</span>
              </p>
            </div>
          </div>

          {/* Mensagem de Erro se houver */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                E-mail Profissional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@odontoprime.com.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dica de Acesso Padrão */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                Acesso Inicial: <strong>admin@odontoprime.com.br</strong> / <strong>admin123</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé institucional */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Clínica OdontoPrime © 2026 • Assistente de Atendimento com IA 24h
        </p>
      </div>
    </div>
  );
};

