import React, { useState, useMemo } from 'react';
import type { User, UserRole, UserStatus } from '../../types/user';
import { RoleBadge, StatusBadge } from '../common/Badge';
import { formatDateBR, calculateAge } from '../../utils/date';
import {
  Search,
  UserPlus,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';

interface UserListProps {
  users: User[];
  currentUserId: string;
  onOpenCreateModal: () => void;
  onToggleStatus: (userId: string) => void;
  onViewUser: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  currentUserId,
  onOpenCreateModal,
  onToggleStatus,
  onViewUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.cpf.includes(search);

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Search, Filters & Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>

          {/* New User Button */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-medium rounded-xl shadow-sm transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Usuário
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </span>

          {/* Status filters */}
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos Status ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('ATIVO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'ATIVO'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ativos ({users.filter((u) => u.status === 'ATIVO').length})
          </button>
          <button
            onClick={() => setStatusFilter('INATIVO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'INATIVO'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inativos ({users.filter((u) => u.status === 'INATIVO').length})
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Role filters */}
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              roleFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos Perfis
          </button>
          <button
            onClick={() => setRoleFilter('USUARIO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              roleFilter === 'USUARIO'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Apenas Usuários ({users.filter((u) => u.role === 'USUARIO').length})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              roleFilter === 'ADMIN'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Administradores ({users.filter((u) => u.role === 'ADMIN').length})
          </button>
        </div>
      </div>

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Usuário</th>
              <th className="py-3.5 px-4">Documento (CPF)</th>
              <th className="py-3.5 px-4">Nascimento / Idade</th>
              <th className="py-3.5 px-4">Perfil</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Nenhum usuário encontrado para os critérios selecionados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isCurrent = user.id === currentUserId;
                const age = calculateAge(user.birthDate);

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isCurrent ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {user.name}
                            {isCurrent && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{user.email}</span>
                            {user.department && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">{user.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CPF */}
                    <td className="py-4 px-4 font-mono text-xs text-slate-700">
                      {user.cpf}
                    </td>

                    {/* Nascimento / Idade */}
                    <td className="py-4 px-4 text-xs">
                      <div className="text-slate-700 font-medium">
                        {formatDateBR(user.birthDate)}
                      </div>
                      {age !== null && (
                        <div className="text-[11px] text-slate-400">{age} anos</div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewUser(user)}
                          title="Visualizar detalhes"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(user.id)}
                          title={user.status === 'ATIVO' ? 'Inativar usuário' : 'Ativar usuário'}
                          className={`p-1.5 rounded-lg transition ${
                            user.status === 'ATIVO'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.status === 'ATIVO' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            Nenhum usuário encontrado.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isCurrent = user.id === currentUserId;
            const age = calculateAge(user.birthDate);

            return (
              <div
                key={user.id}
                className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 ${
                  isCurrent ? 'ring-2 ring-indigo-200 bg-indigo-50/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        {user.name}
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  <RoleBadge role={user.role} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{user.cpf}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {formatDateBR(user.birthDate)} ({age}a)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.department || 'Geral'}</span>
                  </div>
                  <div>
                    <StatusBadge status={user.status} size="sm" />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => onViewUser(user)}
                    className="w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-center transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Ver Detalhes do Usuário
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
