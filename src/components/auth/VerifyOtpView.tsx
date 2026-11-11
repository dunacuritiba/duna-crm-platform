import React, { useState, useEffect } from 'react';
import { AuthLayout } from './AuthLayout';
import { Mail, ArrowRight, RefreshCw, AlertCircle, Inbox, ArrowLeft } from 'lucide-react';
import type { AuthScreen } from '../../types/user';

interface VerifyOtpViewProps {
  email: string;
  onVerify: (email: string, code: string) => Promise<void>;
  onResendOtp: (email: string) => Promise<void>;
  onNavigate: (screen: AuthScreen) => void;
  isLoading?: boolean;
}

export const VerifyOtpView: React.FC<VerifyOtpViewProps> = ({
  email,
  onVerify,
  onResendOtp,
  onNavigate,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clean = code.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setErrorMsg('O código OTP deve ter 6 dígitos numéricos.');
      return;
    }

    try {
      await onVerify(email, clean);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Código OTP incorreto.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    setResendSuccess(false);
    try {
      await onResendOtp(email);
      setResendCooldown(45);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao reenviar código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Ativação de Acesso"
      subtitle="Acesse seu e-mail para pegar o código de verificação"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email verification notice box */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2 text-indigo-950 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <Inbox className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Verifique sua Caixa de Entrada</p>
              <p className="mt-1 text-slate-600 text-xs leading-relaxed">
                Enviamos um código de 6 dígitos para o endereço:
              </p>
              <p className="font-medium text-indigo-700 text-xs mt-0.5 break-all flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {email}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
            Abra seu e-mail (verifique também a pasta de Spam ou Lixo Eletrônico), copie o código de 6
            dígitos e digite-o no campo abaixo.
          </p>
        </div>

        {/* Resend Success Message */}
        {resendSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
            Novo código enviado para o seu e-mail. Por favor, verifique sua caixa de entrada.
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-950 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* OTP Input */}
        <div>
          <label
            htmlFor="otp-code-input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center"
          >
            Código de 6 Dígitos
          </label>
          <div className="max-w-[240px] mx-auto">
            <input
              id="otp-code-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Sua conta será ativada automaticamente assim que o código correto for digitado.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Validando Código...
            </>
          ) : (
            <>
              Validar Código & Ativar Conta
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend & Back */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="text-indigo-600 hover:text-indigo-800 font-medium disabled:text-slate-400"
          >
            {resendCooldown > 0
              ? `Reenviar código (${resendCooldown}s)`
              : isResending
              ? 'Reenviando...'
              : 'Não recebeu? Reenviar código'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
