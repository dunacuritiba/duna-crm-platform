import React, { useState } from 'react';
import type { SignUpInput, FormErrors, AuthScreen } from '../../types/user';
import { formatCPF, isValidCPF } from '../../utils/cpf';
import { isValidBirthDate, calculateAge } from '../../utils/date';
import { AuthLayout } from './AuthLayout';
import { PhotoUploader } from '../common/PhotoUploader';
import {
  User,
  CreditCard,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface RegisterViewProps {
  onRegister: (data: SignUpInput) => Promise<void>;
  onNavigate: (screen: AuthScreen) => void;
  isLoading?: boolean;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegister,
  onNavigate,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SignUpInput>({
    name: '',
    cpf: '',
    email: '',
    birthDate: '',
    avatar: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: 'Comercial',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof SignUpInput, value: string) => {
    let processedValue = value;
    if (field === 'cpf') {
      processedValue = formatCPF(value);
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (touched[field]) {
      validateField(field, processedValue);
    }
  };

  const handleBlur = (field: keyof SignUpInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field] || '');
  };

  const validateField = (field: keyof SignUpInput, value: string): boolean => {
    let error: string | undefined;

    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Informe seu nome completo.';
        } else if (value.trim().split(' ').length < 2) {
          error = 'Informe nome e sobrenome.';
        }
        break;

      case 'cpf':
        if (!value.trim()) {
          error = 'Documento CPF é obrigatório.';
        } else if (value.length < 14) {
          error = 'Complete o CPF (000.000.000-00).';
        } else if (!isValidCPF(value)) {
          error = 'CPF com numeração inválida.';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'E-mail é obrigatório.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Digite um e-mail válido (exemplo@dominio.com).';
        }
        break;

      case 'birthDate': {
        const check = isValidBirthDate(value);
        if (!check.valid) {
          error = check.message;
        }
        break;
      }

      case 'password':
        if (!value) {
          error = 'Crie uma senha de acesso.';
        } else if (value.length < 6) {
          error = 'A senha deve conter no mínimo 6 caracteres.';
        }
        break;

      case 'confirmPassword':
        if (value !== formData.password) {
          error = 'As senhas informadas não conferem.';
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateAll = (): boolean => {
    const nameValid = validateField('name', formData.name);
    const cpfValid = validateField('cpf', formData.cpf);
    const emailValid = validateField('email', formData.email);
    const dateValid = validateField('birthDate', formData.birthDate);
    const passValid = validateField('password', formData.password);
    const confirmValid = validateField('confirmPassword', formData.confirmPassword || '');

    setTouched({
      name: true,
      cpf: true,
      email: true,
      birthDate: true,
      password: true,
      confirmPassword: true,
    });

    return nameValid && cpfValid && emailValid && dateValid && passValid && confirmValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      await onRegister(formData);
    }
  };

  const calculatedAge = formData.birthDate ? calculateAge(formData.birthDate) : null;

  return (
    <AuthLayout
      title="Crie sua Conta no CRM"
      subtitle="Cadastre-se para obter acesso como USUÁRIO e gerenciar seus dados"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Notice Banner */}
        <div className="p-4 bg-sky-50/80 border border-sky-200/80 rounded-2xl flex items-start gap-3 text-sky-950 text-xs sm:text-sm">
          <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Seu acesso será criado com o tipo <strong>USUÁRIO</strong> com permissão restrita a &quot;Meus
            Dados&quot;. Um código <strong>OTP</strong> será enviado diretamente para seu e-mail para ativar
            sua conta.
          </p>
        </div>

        {/* Profile Photo Uploader (with device file pick & live camera capture) */}
        <div>
          <PhotoUploader
            value={formData.avatar}
            onChange={(img) => setFormData((prev) => ({ ...prev, avatar: img }))}
            label="Foto de Perfil"
            helperText="Selecione uma imagem do computador ou tire uma foto agora usando a câmera do seu dispositivo."
          />
        </div>

        {/* Responsive Grid of Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 pt-1">
          {/* Nome Completo - Full width */}
          <div className="sm:col-span-2">
            <label
              htmlFor="register-name"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Ex: Mariana Duarte Souza"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              />
            </div>
            {touched.name && errors.name && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Documento (CPF) - Column 1 */}
          <div>
            <label
              htmlFor="register-cpf"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Documento (CPF) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                id="register-cpf"
                type="text"
                required
                maxLength={14}
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                onBlur={() => handleBlur('cpf')}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              />
              {touched.cpf && !errors.cpf && formData.cpf.length === 14 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            <span className="block text-[11px] text-slate-400 mt-1">Máscara: 000.000.000-00</span>
            {touched.cpf && errors.cpf && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.cpf}
              </p>
            )}
          </div>

          {/* Data de Nascimento - Column 2 */}
          <div>
            <label
              htmlFor="register-birthdate"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Data de Nascimento <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="register-birthdate"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                onBlur={() => handleBlur('birthDate')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              />
            </div>
            {calculatedAge !== null ? (
              <span className="block text-[11px] text-indigo-600 font-medium mt-1">
                {calculatedAge} anos de idade
              </span>
            ) : (
              <span className="block text-[11px] text-slate-400 mt-1">Dia / Mês / Ano</span>
            )}
            {touched.birthDate && errors.birthDate && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.birthDate}
              </p>
            )}
          </div>

          {/* E-mail de Acesso - Full width */}
          <div className="sm:col-span-2">
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              E-mail de Acesso <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                placeholder="seu.email@empresa.com.br"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              />
            </div>
            <span className="block text-[11px] text-slate-400 mt-1">
              O código OTP de ativação será enviado para este endereço
            </span>
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Senha - Column 1 */}
          <div>
            <label
              htmlFor="register-pass"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Criar Senha <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-pass"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 dígitos"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha - Column 2 */}
          <div>
            <label
              htmlFor="register-pass-confirm"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Confirmar Senha <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-pass-confirm"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Repita sua senha"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              />
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cadastrando e enviando OTP...
              </>
            ) : (
              <>
                Finalizar Cadastro & Enviar OTP
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Back to Login */}
        <div className="text-center text-xs text-slate-500 pt-1">
          Já possui conta no CRM?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Fazer login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
