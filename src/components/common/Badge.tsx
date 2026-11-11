import React from 'react';
import type { UserRole, UserStatus } from '../../types/user';
import { ShieldCheck, UserCheck, Clock } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const isAdmin = role === 'ADMIN';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (isAdmin) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200/80 ${sizeClasses}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
        ADMIN
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 ${sizeClasses}`}
    >
      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
      USUÁRIO
    </span>
  );
};

interface StatusBadgeProps {
  status: UserStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (status === 'ATIVO') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Ativo
      </span>
    );
  }

  if (status === 'PENDENTE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}
      >
        <Clock className="w-3 h-3 text-amber-500 animate-spin" />
        Pendente OTP
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
    >
      <Clock className="w-3 h-3 text-slate-400" />
      Inativo
    </span>
  );
};
