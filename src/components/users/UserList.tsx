import React, { useState, useMemo } from 'react';
import type { User, UserRole, UserStatus } from '../../types/user';
import { RoleBadge, StatusBadge } from '../common/Badge';
import { isUserOnline } from '../../services/userService';
import {
  Search,
  UserPlus,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Building,
  Edit2,
  Briefcase,
} from 'lucide-react';

interface UserListProps {
  users: User[];
  currentUserId: string;
  onlineUserIds?: Set<string>;
  onOpenCreateModal: () => void;
  onToggleStatus: (userId: string) => void;
  onViewUser: (user: User) => void;
  onOpenEditModal: (user: User) => void;
  onOpenPortfolioModal: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  currentUserId,
  onlineUserIds,
  onOpenCreateModal,
  onToggleStatus,
  onViewUser,
  onOpenEditModal,
  onOpenPortfolioModal,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus | 'ONLINE'>('ALL');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ONLINE'
          ? isUserOnline(u, currentUserId, onlineUserIds)
          : u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter, currentUserId, onlineUserIds]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Search, Filters & Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="users-search-input"
              name="search"
              type="text"
              placeholder="Buscar por nome ou e-mail..."
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
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </span>

          {/* Status filters */}
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos Status ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === 'ONLINE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
            title="Filtrar usuários conectados agora"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusFilter === 'ONLINE' ? 'bg-white' : 'bg-emerald-500'
              } ${users.some((u) => isUserOnline(u, currentUserId, onlineUserIds)) ? 'animate-pulse' : ''}`}
            />
            Online ({users.filter((u) => isUserOnline(u, currentUserId, onlineUserIds)).length})
          </button>
          <button
            onClick={() => setStatusFilter('ATIVO')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'ATIVO'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ativos ({users.filter((u) => u.status === 'ATIVO').length})
          </button>
          <button
            onClick={() => setStatusFilter('INATIVO')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
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
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              roleFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos Perfis
          </button>
          <button
            onClick={() => setRoleFilter('ATENDENTE')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              roleFilter === 'ATENDENTE'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Atendimento ({users.filter((u) => u.role === 'ATENDENTE').length})
          </button>
          <button
            onClick={() => setRoleFilter('USUARIO')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              roleFilter === 'USUARIO'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Usuários ({users.filter((u) => u.role === 'USUARIO').length})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
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
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[760px] table-fixed">
            <colgroup>
              <col className="w-auto" />
              <col className="w-64" />
              <col className="w-36" />
              <col className="w-48" />
            </colgroup>
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6 text-left whitespace-nowrap">Usuário</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap">Perfil</th>
                <th className="py-3.5 px-4 text-left whitespace-nowrap">Status</th>
                <th className="py-3.5 px-6 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Nenhum usuário encontrado para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUserId;
                  const online = isUserOnline(user, currentUserId, onlineUserIds);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrent ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* User info */}
                      <td className="py-4 px-6 whitespace-nowrap text-left">
                        <div className="flex items-center gap-3.5">
                          <div className="relative inline-block shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                            {online && (
                              <span
                                className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs ring-1 ring-emerald-600/20"
                                title="Online agora"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {user.name}
                              {online && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Online
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-slate-500">{user.email}</span>
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

                      {/* Role & Portfolio */}
                      <td className="py-4 px-4 whitespace-nowrap text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <RoleBadge role={user.role} />
                          {user.role === 'ATENDENTE' && (
                            <button
                              type="button"
                              onClick={() => onOpenPortfolioModal(user)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition whitespace-nowrap shadow-xs cursor-pointer"
                              title="Gerenciar carteira de clientes"
                            >
                              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                              <span>Carteira: <strong className="font-semibold">{user.assignedClinicsCount || 0}</strong></span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap text-left">
                        <div className="flex items-center">
                          <StatusBadge status={user.status} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.role === 'ATENDENTE' && (
                            <button
                              onClick={() => onOpenPortfolioModal(user)}
                              title="Distribuir Carteira de Clientes"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Briefcase className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenEditModal(user)}
                            title="Editar Usuário"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

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
            const online = isUserOnline(user, currentUserId, onlineUserIds);

            return (
              <div
                key={user.id}
                className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 ${
                  isCurrent ? 'ring-2 ring-indigo-200 bg-indigo-50/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative inline-block shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                      {online && (
                        <span
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs ring-1 ring-emerald-600/20"
                          title="Online agora"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        {user.name}
                        {online && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        )}
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

                <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.department || 'Geral'}</span>
                  </div>
                  <StatusBadge status={user.status} size="sm" />
                </div>

                <div className="pt-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button
                    onClick={() => onViewUser(user)}
                    className="flex-1 min-w-[90px] py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-center transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Detalhes
                  </button>

                  <button
                    onClick={() => onOpenEditModal(user)}
                    className="flex-1 min-w-[90px] py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 text-center transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                    Editar
                  </button>

                  {user.role === 'ATENDENTE' && (
                    <button
                      onClick={() => onOpenPortfolioModal(user)}
                      className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 text-center transition flex items-center justify-center gap-1 whitespace-nowrap"
                      title="Gerenciar Carteira"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                      Carteira ({user.assignedClinicsCount || 0})
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
