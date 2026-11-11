import React from 'react';
import type { User } from '../../types/user';
import { RoleBadge, StatusBadge } from '../common/Badge';
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

interface OverviewProps {
  users: User[];
  onOpenCreateModal: () => void;
  onGoToUsers: () => void;
  onViewUser: (user: User) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  users,
  onOpenCreateModal,
  onGoToUsers,
  onViewUser,
}) => {
  const total = users.length;
  const activeCount = users.filter((u) => u.status === 'ATIVO').length;
  const inactiveCount = users.filter((u) => u.status === 'INATIVO').length;
  const standardUsersCount = users.filter((u) => u.role === 'USUARIO').length;

  const activePercentage = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const standardUserPercentage = total > 0 ? Math.round((standardUsersCount / total) * 100) : 0;

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-slate-50 border border-indigo-100 rounded-3xl p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> CRM 2.0 • Módulo de Usuários
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Gestão Centralizada de Acessos
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Plataforma moderna para cadastro, validação de documentos com máscara CPF e controle de
            permissões de perfil USUÁRIO e ADMINISTRADOR.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar Novo Usuário
            </button>
            <button
              onClick={onGoToUsers}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition"
            >
              Ver Tabela Completa
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total de Contas
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Cadastrados no CRM
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Usuários Ativos
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{activeCount}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {activePercentage}% com acesso liberado
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Contas Inativas
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{inactiveCount}</p>
            <p className="text-xs text-slate-400 mt-1">Acesso suspenso</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Standard Role (USUARIO) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Perfil USUÁRIO
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{standardUsersCount}</p>
            <p className="text-xs text-sky-600 font-medium mt-1">
              {standardUserPercentage}% restrito a &apos;Meus Dados&apos;
            </p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Recent Registrations & Policy Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Últimos Usuários Cadastrados
            </h2>
            <button
              onClick={onGoToUsers}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ver todos ({total})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onViewUser(user)}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <RoleBadge role={user.role} size="sm" />
                  <StatusBadge status={user.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Access Policies Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800">Políticas de Permissão</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl">
              <p className="font-semibold text-sky-950">1. Cadastro Automático</p>
              <p className="text-sky-800 mt-1 leading-relaxed">
                Qualquer novo usuário cadastrado recebe automaticamente o tipo <strong>USUÁRIO</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <p className="font-semibold text-slate-800">2. Escopo Restrito</p>
              <p className="text-slate-600 mt-1 leading-relaxed">
                O tipo USUÁRIO enxerga única e exclusivamente a tela <strong>&quot;Meus Dados&quot;</strong>, sem
                visibilidade da carteira geral de clientes ou gestão de usuários.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
              <p className="font-semibold text-amber-950">3. Proteção Cadastral</p>
              <p className="text-amber-800 mt-1 leading-relaxed">
                O usuário pode trocar livremente sua <strong>foto de perfil</strong>, mas não pode
                modificar <strong>e-mail</strong>, <strong>CPF</strong> e{' '}
                <strong>data de nascimento</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
