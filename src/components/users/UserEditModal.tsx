import React, { useState, useEffect } from 'react';
import type { User, UserStatus, UpdateUserInput } from '../../types/user';
import { Modal } from '../common/Modal';
import { formatCPF, isValidCPF } from '../../utils/cpf';
import { isValidBirthDate } from '../../utils/date';
import { PhotoUploader } from '../common/PhotoUploader';
import {
  User as UserIcon,
  CreditCard,
  Mail,
  Calendar,
  Phone,
  Building,
  Shield,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, data: UpdateUserInput) => Promise<void>;
  onOpenPortfolioModal?: (user: User) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  onOpenPortfolioModal,
}) => {
  const [formData, setFormData] = useState<UpdateUserInput>({
    name: '',
    cpf: '',
    email: '',
    birthDate: '',
    phone: '',
    department: '',
    role: 'USUARIO',
    status: 'ATIVO',
    avatar: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        cpf: user.cpf || '',
        email: user.email || '',
        birthDate: user.birthDate || '',
        phone: user.phone || '',
        department: user.department || 'Atendimento',
        role: user.role || 'USUARIO',
        status: user.status || 'ATIVO',
        avatar: user.avatar || '',
      });
      setErrors({});
    }
  }, [user]);

  if (!user) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório.';
    }

    if (formData.cpf) {
      if (formData.cpf.length < 14) {
        newErrors.cpf = 'CPF incompleto.';
      } else if (!isValidCPF(formData.cpf)) {
        newErrors.cpf = 'CPF inválido.';
      }
    }

    if (formData.birthDate) {
      const birthCheck = isValidBirthDate(formData.birthDate);
      if (!birthCheck.valid) {
        newErrors.birthDate = birthCheck.message || 'Data inválida.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(user.id, formData);
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, general: err.message || 'Erro ao salvar alterações.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAttendant = formData.role === 'ATENDENTE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Cadastro de Usuário"
      subtitle={`Gerenciar permissões e dados de ${user.name}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Avatar Uploader */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <PhotoUploader
            value={formData.avatar || ''}
            onChange={(url: string) => setFormData((prev) => ({ ...prev, avatar: url }))}
            label="Foto de Perfil do Usuário"
            helperText="Envie uma imagem ou utilize a câmera para atualizar a foto"
          />
        </div>

        {/* Role & Access Selection Box */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
          <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
            Perfil de Acesso & Função no CRM
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* ADMIN */}
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'ADMIN' }))}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                formData.role === 'ADMIN'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Shield className="w-4 h-4" />
                {formData.role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="font-bold text-xs">Administrador</p>
                <p className={`text-[10px] ${formData.role === 'ADMIN' ? 'text-violet-200' : 'text-slate-400'}`}>
                  Acesso total ao sistema
                </p>
              </div>
            </button>

            {/* ATENDENTE */}
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  role: 'ATENDENTE',
                  department: prev.department || 'Atendimento ao Cliente',
                }))
              }
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                formData.role === 'ATENDENTE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Headphones className="w-4 h-4" />
                {formData.role === 'ATENDENTE' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="font-bold text-xs">Equipe de Atendimento</p>
                <p className={`text-[10px] ${formData.role === 'ATENDENTE' ? 'text-amber-200' : 'text-slate-400'}`}>
                  Gere carteira e agendas
                </p>
              </div>
            </button>

            {/* USUARIO */}
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'USUARIO' }))}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                formData.role === 'USUARIO'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <UserIcon className="w-4 h-4" />
                {formData.role === 'USUARIO' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="font-bold text-xs">Usuário Padrão</p>
                <p className={`text-[10px] ${formData.role === 'USUARIO' ? 'text-sky-200' : 'text-slate-400'}`}>
                  Acesso restrito / perfil
                </p>
              </div>
            </button>
          </div>

          {/* Quick Portfolio Action if Attendant */}
          {isAttendant && onOpenPortfolioModal && (
            <div className="mt-3 pt-3 border-t border-indigo-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-indigo-900">
                <span className="font-bold">Carteira de Clientes:</span>{' '}
                {user.assignedClinicsCount || 0} clínica(s) vinculada(s)
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onSave(user.id, formData);
                    onOpenPortfolioModal({
                      ...user,
                      ...formData,
                      id: user.id,
                      role: formData.role || 'ATENDENTE',
                    });
                  } catch {
                    onOpenPortfolioModal({
                      ...user,
                      ...formData,
                      id: user.id,
                      role: formData.role || 'ATENDENTE',
                    });
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition whitespace-nowrap self-start sm:self-auto"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Distribuir Clientes na Carteira
              </button>
            </div>
          )}
        </div>

        {/* Personal & Professional Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <UserIcon className="w-3.5 h-3.5 text-indigo-500" /> Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              placeholder="Ex: João Silva"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* E-mail (Somente leitura para integridade de login) */}
          <div>
            <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Mail className="w-3.5 h-3.5 text-indigo-500" /> E-mail de Acesso
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400 mt-1">E-mail vinculado à autenticação do usuário</p>
          </div>

          {/* CPF */}
          <div>
            <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Documento CPF
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              maxLength={14}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              placeholder="000.000.000-00"
            />
            {errors.cpf && <p className="text-[11px] text-rose-500 mt-1">{errors.cpf}</p>}
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Data de Nascimento
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
            {errors.birthDate && <p className="text-[11px] text-rose-500 mt-1">{errors.birthDate}</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Departamento */}
          <div>
            <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Building className="w-3.5 h-3.5 text-indigo-500" /> Departamento
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              placeholder="Ex: Atendimento, Suporte, Recepção"
            />
          </div>

          {/* Status da Conta */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Situação da Conta
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="ATIVO"
                  checked={formData.status === 'ATIVO'}
                  onChange={() => setFormData((prev) => ({ ...prev, status: 'ATIVO' as UserStatus }))}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Ativo (pode acessar o sistema)
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="INATIVO"
                  checked={formData.status === 'INATIVO'}
                  onChange={() => setFormData((prev) => ({ ...prev, status: 'INATIVO' as UserStatus }))}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                Inativo (acesso bloqueado)
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
