import React, { useState } from 'react';
import type { CreateUserInput, FormErrors } from '../../types/user';
import { formatCPF, isValidCPF } from '../../utils/cpf';
import { isValidBirthDate, calculateAge } from '../../utils/date';
import { PhotoUploader } from '../common/PhotoUploader';
import {
  User,
  CreditCard,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

interface UserFormProps {
  onSubmit: (data: CreateUserInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    cpf: '',
    email: '',
    birthDate: '',
    avatar: '',
    phone: '',
    department: 'Comercial',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  // Handle field change
  const handleChange = (field: keyof CreateUserInput, value: string) => {
    let processedValue = value;

    if (field === 'cpf') {
      processedValue = formatCPF(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    // Real-time clearance of error if user corrected it
    if (touched[field]) {
      validateField(field, processedValue);
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof CreateUserInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field] || '');
  };

  // Validate single field
  const validateField = (field: keyof CreateUserInput, value: string): boolean => {
    let error: string | undefined;

    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = 'Informe o nome completo do usuário.';
        } else if (value.trim().split(' ').length < 2) {
          error = 'Por favor, digite nome e sobrenome.';
        }
        break;

      case 'cpf':
        if (!value.trim()) {
          error = 'Documento CPF é obrigatório.';
        } else if (value.length < 14) {
          error = 'Complete o CPF no formato 000.000.000-00.';
        } else if (!isValidCPF(value)) {
          error = 'CPF inválido. Verifique os dígitos digitados.';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'E-mail é obrigatório para o acesso.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Digite um e-mail válido no formato nome@dominio.com.';
        }
        break;

      case 'birthDate': {
        const check = isValidBirthDate(value);
        if (!check.valid) {
          error = check.message;
        }
        break;
      }

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  // Validate entire form
  const validateAll = (): boolean => {
    const nameValid = validateField('name', formData.name);
    const cpfValid = validateField('cpf', formData.cpf);
    const emailValid = validateField('email', formData.email);
    const dateValid = validateField('birthDate', formData.birthDate);

    setTouched({
      name: true,
      cpf: true,
      email: true,
      birthDate: true,
      avatar: true,
    });

    return nameValid && cpfValid && emailValid && dateValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      onSubmit(formData);
    }
  };

  const calculatedAge = formData.birthDate ? calculateAge(formData.birthDate) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Notice about Default USUARIO role */}
      <div className="p-4 bg-sky-50/80 border border-sky-200/70 rounded-2xl flex items-start gap-3 text-sky-900 text-xs sm:text-sm">
        <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sky-950">Perfil de Acesso Padrão: USUÁRIO</p>
          <p className="mt-0.5 text-sky-800/90 leading-relaxed">
            Ao cadastrar, este acesso será automaticamente criado como <strong>USUÁRIO</strong>. Ele terá
            permissão de acesso apenas à seção <strong>&quot;Meus Dados&quot;</strong>, podendo atualizar a foto
            de perfil, mas impedido de alterar dados sensíveis como e-mail e data de nascimento.
          </p>
        </div>
      </div>

      {/* Photo Uploader (File or Device Camera) */}
      <PhotoUploader
        value={formData.avatar}
        onChange={(img) => setFormData((prev) => ({ ...prev, avatar: img }))}
        label="Foto de Perfil do Usuário"
        helperText="Selecione um arquivo de imagem do dispositivo ou capture uma foto com a câmera."
      />

      {/* Responsive Grid of inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome Completo */}
        <div className="sm:col-span-2">
          <label htmlFor="user-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Nome Completo <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="user-name"
              type="text"
              required
              placeholder="Ex: Ana Clara Rodrigues"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={`w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                touched.name && errors.name
                  ? 'border-rose-300 focus:ring-rose-200'
                  : touched.name && !errors.name && formData.name
                  ? 'border-emerald-300 focus:ring-emerald-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
          </div>
          {touched.name && errors.name && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.name}
            </p>
          )}
        </div>

        {/* CPF com Máscara */}
        <div>
          <label htmlFor="user-cpf" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Documento (CPF) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <input
              id="user-cpf"
              type="text"
              required
              maxLength={14}
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              onBlur={() => handleBlur('cpf')}
              className={`w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl border text-sm font-mono transition focus:outline-none focus:ring-2 ${
                touched.cpf && errors.cpf
                  ? 'border-rose-300 focus:ring-rose-200'
                  : touched.cpf && !errors.cpf && formData.cpf.length === 14
                  ? 'border-emerald-300 focus:ring-emerald-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {touched.cpf && !errors.cpf && formData.cpf.length === 14 && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
          <span className="block text-[11px] text-slate-400 mt-1">Máscara automática: 000.000.000-00</span>
          {touched.cpf && errors.cpf && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.cpf}
            </p>
          )}
        </div>

        {/* Data de Nascimento */}
        <div>
          <label htmlFor="user-birthdate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Data de Nascimento <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              id="user-birthdate"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              onBlur={() => handleBlur('birthDate')}
              className={`w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                touched.birthDate && errors.birthDate
                  ? 'border-rose-300 focus:ring-rose-200'
                  : touched.birthDate && !errors.birthDate && formData.birthDate
                  ? 'border-emerald-300 focus:ring-emerald-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
          </div>
          {calculatedAge !== null ? (
            <span className="block text-[11px] text-indigo-600 font-medium mt-1">
              Idade calculada: {calculatedAge} anos
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

        {/* E-mail */}
        <div className="sm:col-span-2">
          <label htmlFor="user-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            E-mail de Acesso <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="user-email"
              type="email"
              required
              autoComplete="email"
              placeholder="usuario@empresa.com.br"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                touched.email && errors.email
                  ? 'border-rose-300 focus:ring-rose-200'
                  : touched.email && !errors.email && formData.email
                  ? 'border-emerald-300 focus:ring-emerald-100'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
          </div>
          <span className="block text-[11px] text-slate-400 mt-1">Será usado para login no CRM</span>
          {touched.email && errors.email && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Departamento / Setor */}
        <div className="sm:col-span-2">
          <label htmlFor="user-dept" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Departamento
          </label>
          <select
            id="user-dept"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          >
            <option value="Comercial">Comercial & Vendas</option>
            <option value="Suporte & CS">Suporte & CS</option>
            <option value="Marketing">Marketing</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Operações">Operações</option>
            <option value="Tecnologia">Tecnologia</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cadastrando...
            </>
          ) : (
            'Cadastrar Usuário'
          )}
        </button>
      </div>
    </form>
  );
};
