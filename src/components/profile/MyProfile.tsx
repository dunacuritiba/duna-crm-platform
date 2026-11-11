import React, { useState } from 'react';
import type { User, UpdateUserProfileInput } from '../../types/user';
import { RoleBadge, StatusBadge } from '../common/Badge';
import { formatDateBR, calculateAge } from '../../utils/date';
import { PhotoUploader } from '../common/PhotoUploader';
import {
  User as UserIcon,
  CreditCard,
  Mail,
  Calendar,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Building,
  Phone,
  Info,
} from 'lucide-react';

interface MyProfileProps {
  currentUser: User;
  onUpdateProfile: (updates: UpdateUserProfileInput) => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ currentUser, onUpdateProfile }) => {
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [name, setName] = useState(currentUser.name);
  const [isSaved, setIsSaved] = useState(false);

  const isStandardUser = currentUser.role === 'USUARIO';
  const age = calculateAge(currentUser.birthDate);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      avatar,
      phone,
      name: isStandardUser ? currentUser.name : name,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Role explanation banner */}
      {isStandardUser ? (
        <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3.5 text-amber-900 shadow-xs">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-amber-950">
              Acesso Restrito: Perfil USUÁRIO
            </p>
            <p className="mt-1 text-amber-800/90 leading-relaxed">
              Você está conectado como <strong>USUÁRIO</strong>. De acordo com as diretrizes do CRM, você
              tem permissão para atualizar sua <strong>foto de perfil</strong> e contato. Para garantir a
              integridade cadastral, campos sensíveis como <strong>E-mail</strong>,{' '}
              <strong>Documento (CPF)</strong> e <strong>Data de Nascimento</strong> são estritamente bloqueados para alteração.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-start gap-3.5 text-indigo-900 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-indigo-950">Perfil com Acesso Total: ADMINISTRADOR</p>
            <p className="mt-1 text-indigo-800/90 leading-relaxed">
              Você tem permissões de gerenciamento completas sobre a plataforma CRM, podendo criar usuários,
              inativar contas e gerenciar acessos.
            </p>
          </div>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Cover / Header section */}
        <div className="h-36 bg-gradient-to-r from-indigo-50 via-sky-50 to-slate-100 border-b border-slate-200/70 p-6 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/70 shadow-xs">
              Gestão de Perfil Pessoal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={currentUser.role} />
            <StatusBadge status={currentUser.status} />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Avatar & Basic Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-14 sm:-mt-16">
            <div className="relative group shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={currentUser.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-xl ring-2 ring-slate-200/80 bg-white"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-xl ring-2 ring-slate-200/80 bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Identity Info */}
            <div className="text-center sm:text-left pt-2 sm:pt-6 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {currentUser.name}
              </h2>
              <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.department || 'Geral'}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Membro desde {new Date(currentUser.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Photo Uploader (File or Device Camera) */}
          <PhotoUploader
            value={avatar}
            onChange={(img) => setAvatar(img)}
            label="Alterar Foto de Perfil"
            helperText="Selecione um arquivo de foto do computador ou capture uma nova imagem com a câmera."
          />

          {/* Form Fields: Distinguish Editable vs Locked */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Informações Cadastrais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nome Completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled={isStandardUser}
                    value={isStandardUser ? currentUser.name : name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
                      isStandardUser
                        ? 'bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500'
                    }`}
                  />
                  {isStandardUser && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {isStandardUser && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Alteração de nome permitida apenas pelo setor de Recursos Humanos/Admin.
                  </p>
                )}
              </div>

              {/* Documento (CPF) - LOCKED */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Documento (CPF)
                  </label>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Protegido
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={currentUser.cpf}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 text-slate-600 border border-slate-200 rounded-xl text-sm font-mono cursor-not-allowed select-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Documento fiscal autenticado. Não pode ser alterado diretamente.
                </span>
              </div>

              {/* Data de Nascimento - LOCKED per requirement */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Data de Nascimento
                  </label>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Protegido
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={`${formatDateBR(currentUser.birthDate)} ${
                      age !== null ? `(${age} anos)` : ''
                    }`}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 text-slate-600 border border-slate-200 rounded-xl text-sm cursor-not-allowed select-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Não é permitida a troca da data de nascimento pelo usuário.
                </span>
              </div>

              {/* E-mail de Acesso - LOCKED per requirement */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    E-mail de Acesso
                  </label>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Protegido
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    readOnly
                    value={currentUser.email}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 text-slate-600 border border-slate-200 rounded-xl text-sm cursor-not-allowed select-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Chave primária de acesso. Não pode ser alterada pelo usuário.
                </span>
              </div>

              {/* Telefone de Contato (EDITABLE) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                  />
                </div>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Pode ser atualizado livremente para contato interno.
                </span>
              </div>
            </div>
          </div>

          {/* Action Button & Confirmation */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              {isSaved ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Alterações salvas com sucesso!
                </span>
              ) : (
                <span>Clique em salvar para persistir a nova foto de perfil e contatos.</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
