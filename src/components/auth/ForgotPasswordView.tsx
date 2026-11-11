import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Mail, ArrowRight, RefreshCw, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { AuthScreen } from '../../types/user';

interface ForgotPasswordViewProps {
  onRequestOtp: (email: string) => Promise<{ email: string }>;
  onSuccess: (email: string) => void;
  onNavigate: (screen: AuthScreen) => void;
  isLoading?: boolean;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onRequestOtp,
  onSuccess,
  onNavigate,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Informe o e-mail cadastrado na plataforma.');
      return;
    }

    try {
      const res = await onRequestOtp(email.trim());
      onSuccess(res.email);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao solicitar código de recuperação.');
    }
  };

  return (
    <AuthLayout
      title="Recuperação de Acesso"
      subtitle="Informe seu e-mail para receber o código OTP de redefinição de senha"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Important Policy Alert */}
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-950 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Atenção de Segurança:</strong> Ao solicitar a recuperação, o acesso regular via login
            ficará temporariamente inativo por proteção até que a nova senha seja cadastrada com sucesso.
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-950 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* E-mail */}
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            E-mail Cadastrado
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              spellCheck={false}
              placeholder="seu.email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verificando e enviando...
            </>
          ) : (
            <>
              Enviar Código OTP de Recuperação
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Back */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o Login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
