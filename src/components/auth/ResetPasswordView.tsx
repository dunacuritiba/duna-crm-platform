import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Lock, Eye, EyeOff, KeyRound, ArrowRight, RefreshCw, AlertCircle, Inbox, Mail, ArrowLeft } from 'lucide-react';
import type { AuthScreen } from '../../types/user';

interface ResetPasswordViewProps {
  email: string;
  onCompleteReset: (email: string, code: string, newPass: string) => Promise<void>;
  onNavigate: (screen: AuthScreen) => void;
  isLoading?: boolean;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  email,
  onCompleteReset,
  onNavigate,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = code.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMsg('O código OTP deve possuir 6 dígitos numéricos.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas informadas não coincidem.');
      return;
    }

    try {
      await onCompleteReset(email, cleanCode, newPassword);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao redefinir senha.');
    }
  };

  return (
    <AuthLayout
      title="Redefinição de Senha"
      subtitle="Acesse seu e-mail para pegar o código OTP e cadastrar sua nova senha"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Notice to check email */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1.5 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <Inbox className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Código Enviado para seu E-mail</p>
              <p className="text-slate-600 text-xs mt-0.5">
                Enviamos o código de recuperação para:
              </p>
              <p className="font-medium text-amber-800 text-xs mt-0.5 break-all flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {email}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-amber-100">
            Acesse seu e-mail, localize a mensagem do NexusCRM com o código de 6 dígitos e digite abaixo.
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-950 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* OTP Input */}
        <div>
          <label
            htmlFor="reset-otp-input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Código OTP Recebido por E-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id="reset-otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl font-mono text-base tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Digite o código de 6 dígitos que você recebeu no e-mail.
          </p>
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="new-pass-input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Nova Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="new-pass-input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            htmlFor="confirm-new-pass-input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="confirm-new-pass-input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || code.length !== 6 || !newPassword}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Atualizando senha...
            </>
          ) : (
            <>
              Salvar Nova Senha & Liberar Login
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Back */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancelar e voltar ao login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
