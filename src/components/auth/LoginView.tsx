import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import type { AuthScreen } from '../../types/user';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onNavigate: (screen: AuthScreen, emailPreFill?: string) => void;
  isLoading?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onNavigate, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'VERIFY_OTP' | 'RESET_PASSWORD' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingAction(null);

    if (!email.trim() || !password) {
      setErrorMsg('Informe seu e-mail e senha.');
      return;
    }

    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao autenticar.';
      setErrorMsg(msg);
      if (err?.code === 'ACCOUNT_PENDING') {
        setPendingEmail(err.email || email);
        setPendingAction('VERIFY_OTP');
      } else if (err?.code === 'PASSWORD_RESET_PENDING') {
        setPendingEmail(err.email || email);
        setPendingAction('RESET_PASSWORD');
      }
    }
  };

  return (
    <AuthLayout
      title="Acesse sua Conta"
      subtitle="Entre com suas credenciais para gerenciar ou acessar seus dados no CRM"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2 text-rose-950 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{errorMsg}</p>
            </div>

            {pendingAction === 'VERIFY_OTP' && pendingEmail && (
              <button
                type="button"
                onClick={() => onNavigate('verify-registration-otp', pendingEmail)}
                className="mt-1 text-xs font-semibold text-rose-700 hover:text-rose-900 underline text-left flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Digitar código OTP para ativar conta agora
              </button>
            )}

            {pendingAction === 'RESET_PASSWORD' && pendingEmail && (
              <button
                type="button"
                onClick={() => onNavigate('verify-reset-otp', pendingEmail)}
                className="mt-1 text-xs font-semibold text-rose-700 hover:text-rose-900 underline text-left flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Continuar troca de senha e reativar acesso
              </button>
            )}
          </div>
        )}

        {/* E-mail */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            E-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="username"
              spellCheck={false}
              placeholder="seu.email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Senha
            </label>
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
            >
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Autenticando...
            </>
          ) : (
            <>
              Entrar na Plataforma
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Link to Register */}
        <div className="pt-2 text-center text-xs text-slate-500">
          Não possui uma conta?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Cadastre-se agora
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
