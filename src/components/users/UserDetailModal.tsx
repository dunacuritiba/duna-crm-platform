import React from 'react';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { RoleBadge, StatusBadge } from '../common/Badge';
import { formatDateBR, calculateAge } from '../../utils/date';
import {
  CreditCard,
  Mail,
  Calendar,
  Building,
  Phone,
  Clock,
  Shield,
} from 'lucide-react';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!user) return null;

  const age = calculateAge(user.birthDate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Usuário" subtitle={`ID: ${user.id}`}>
      <div className="space-y-6">
        {/* User Card Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate">{user.name}</h3>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <RoleBadge role={user.role} size="sm" />
              <StatusBadge status={user.status} size="sm" />
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Documento (CPF)
            </span>
            <p className="text-sm font-mono font-medium text-slate-800">{user.cpf}</p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Nascimento
            </span>
            <p className="text-sm font-medium text-slate-800">
              {formatDateBR(user.birthDate)} {age !== null && `(${age} anos)`}
            </p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-indigo-500" /> E-mail
            </span>
            <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Building className="w-3.5 h-3.5 text-indigo-500" /> Departamento
            </span>
            <p className="text-sm font-medium text-slate-800">{user.department || 'Geral'}</p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> Telefone
            </span>
            <p className="text-sm font-medium text-slate-800">{user.phone || 'Não informado'}</p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Cadastrado em
            </span>
            <p className="text-sm font-medium text-slate-800">
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Access level overview */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Shield className="w-4 h-4 text-indigo-600" />
            Nível de Permissão:{' '}
            {user.role === 'ADMIN' ? 'Acesso Total (Administrador)' : 'Acesso Padrão (USUÁRIO)'}
          </div>
          <p className="text-slate-500 leading-relaxed">
            {user.role === 'ADMIN'
              ? 'Pode gerenciar todos os usuários, criar cadastros e alterar configurações do sistema.'
              : 'Possui acesso restrito exclusivamente à tela "Meus Dados". Pode atualizar foto de perfil, porém e-mail e data de nascimento são estritamente protegidos.'}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
