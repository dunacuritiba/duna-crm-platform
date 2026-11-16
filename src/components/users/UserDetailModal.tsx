import React from 'react';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { RoleBadge, StatusBadge } from '../common/Badge';
import { formatDateBR, calculateAge } from '../../utils/date';
import { isUserOnline } from '../../services/userService';
import {
  CreditCard,
  Mail,
  Calendar,
  Building,
  Phone,
  Clock,
  Edit2,
  Briefcase,
  Activity,
} from 'lucide-react';

interface UserDetailModalProps {
  user: User | null;
  currentUserId?: string;
  onlineUserIds?: Set<string>;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditModal?: (user: User) => void;
  onOpenPortfolioModal?: (user: User) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  currentUserId,
  onlineUserIds,
  isOpen,
  onClose,
  onOpenEditModal,
  onOpenPortfolioModal,
}) => {
  if (!user) return null;

  const age = calculateAge(user.birthDate);
  const online = isUserOnline(user, currentUserId, onlineUserIds);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Usuário" subtitle={`ID: ${user.id}`}>
      <div className="space-y-6">
        {/* User Card Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="relative inline-block shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
            />
            {online && (
              <span
                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs ring-1 ring-emerald-600/20"
                title="Online agora"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate">{user.name}</h3>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <RoleBadge role={user.role} size="sm" />
              <StatusBadge status={user.status} size="sm" />
              {online && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online agora
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Documento (CPF)
            </span>
            <p className="text-sm font-mono font-medium text-slate-800">{user.cpf || 'Não informado'}</p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Nascimento / Idade
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
              <Activity className="w-3.5 h-3.5 text-indigo-500" /> Status de Presença
            </span>
            <p className="text-sm font-medium text-slate-800">
              {online ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ativo na plataforma agora
                </span>
              ) : user.lastSeenAt ? (
                `Visto por último em ${new Date(user.lastSeenAt).toLocaleString('pt-BR')}`
              ) : (
                'Offline'
              )}
            </p>
          </div>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-xs sm:col-span-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Cadastrado em
            </span>
            <p className="text-sm font-medium text-slate-800">
              {new Date(user.createdAt).toLocaleDateString('pt-BR')} às {new Date(user.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {user.role === 'ATENDENTE' && onOpenPortfolioModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortfolioModal(user);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                Distribuir Carteira ({user.assignedClinicsCount || 0})
              </button>
            )}

            {onOpenEditModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditModal(user);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Usuário
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
