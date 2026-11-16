import React from 'react';
import type { UserRole } from '../../types/user';
import { APP_CONFIG } from '../../config/version';
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  UserCheck,
  Lock,
  CalendarCheck,
  Briefcase,
  MessageSquare,
  LifeBuoy,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'users'
  | 'clinics'
  | 'portfolio'
  | 'agendas'
  | 'leads'
  | 'chat'
  | 'support'
  | 'profile';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isAdmin = userRole === 'ADMIN';
  const isAttendant = userRole === 'ATENDENTE';

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      allowedRoles: ['ADMIN'] as UserRole[],
      description: 'Métricas e resumo do CRM',
    },
    {
      id: 'users' as NavTab,
      label: 'Gestão de Usuários',
      icon: Users,
      allowedRoles: ['ADMIN'] as UserRole[],
      description: 'Listagem e criação de contas',
    },
    {
      id: 'clinics' as NavTab,
      label: isAttendant ? 'Minha Carteira' : 'Clínicas Médicas',
      icon: isAttendant ? Briefcase : Building2,
      allowedRoles: ['ADMIN', 'ATENDENTE'] as UserRole[],
      description: isAttendant ? 'Clínicas sob sua gestão' : 'CNPJ, CRM e corpo clínico',
    },
    {
      id: 'portfolio' as NavTab,
      label: 'Gestão de Carteiras',
      icon: Briefcase,
      allowedRoles: ['ADMIN'] as UserRole[],
      description: 'Distribuição de clientes por atendente',
    },
    {
      id: 'agendas' as NavTab,
      label: 'Gestão de Agendas',
      icon: CalendarCheck,
      allowedRoles: ['ADMIN', 'ATENDENTE'] as UserRole[],
      description: 'Agendamentos e consultas dos pacientes',
    },
    {
      id: 'leads' as NavTab,
      label: 'Gestão de Leads',
      icon: Target,
      allowedRoles: ['ADMIN'] as UserRole[],
      description: 'Captação e funil comercial',
    },
    {
      id: 'chat' as NavTab,
      label: 'Chat Interno',
      icon: MessageSquare,
      allowedRoles: ['ADMIN', 'ATENDENTE', 'USUARIO'] as UserRole[],
      description: 'Conversas em grupo e 1 a 1',
    },
    {
      id: 'support' as NavTab,
      label: 'Suporte & Chamados',
      icon: LifeBuoy,
      allowedRoles: ['ADMIN', 'ATENDENTE', 'USUARIO'] as UserRole[],
      description: 'Abertura de chamados com SLA',
    },
    {
      id: 'profile' as NavTab,
      label: 'Meus Dados',
      icon: UserCheck,
      allowedRoles: ['ADMIN', 'ATENDENTE', 'USUARIO'] as UserRole[],
      description: 'Foto e dados pessoais',
    },
  ];

  const handleTabClick = (tab: NavTab, allowedRoles: UserRole[]) => {
    if (!allowedRoles.includes(userRole)) return;
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[65px] left-0 h-screen lg:h-[calc(100vh-65px)] w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 z-40 transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Section title */}
          <div className="px-3 pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navegação Principal
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isLocked = !item.allowedRoles.includes(userRole);

              // Don't render locked items for non-admins if it's adminOnly like leads
              if (isLocked && !isAdmin) {
                return null;
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id, item.allowedRoles)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : isLocked
                      ? 'opacity-40 text-slate-400 cursor-not-allowed bg-slate-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isLocked && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Footer: App Version */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs px-2">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{APP_CONFIG.name}</span>
          </div>
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            v{APP_CONFIG.version}
          </span>
        </div>
      </aside>
    </>
  );
};
