import React from 'react';
import type { UserRole } from '../../types/user';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Shield,
  Lock,
  Info,
} from 'lucide-react';

export type NavTab = 'overview' | 'users' | 'clinics' | 'profile';

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

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      adminOnly: true,
      description: 'Métricas e resumo do CRM',
    },
    {
      id: 'users' as NavTab,
      label: 'Gestão de Usuários',
      icon: Users,
      adminOnly: true,
      description: 'Listagem e criação de contas',
    },
    {
      id: 'clinics' as NavTab,
      label: 'Clínicas Médicas',
      icon: Building2,
      adminOnly: true,
      description: 'CNPJ, CRM e corpo clínico',
    },
    {
      id: 'profile' as NavTab,
      label: 'Meus Dados',
      icon: UserCheck,
      adminOnly: false,
      description: 'Foto e dados pessoais',
    },
  ];

  const handleTabClick = (tab: NavTab, adminOnly: boolean) => {
    if (adminOnly && !isAdmin) return;
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
              const isLocked = item.adminOnly && !isAdmin;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id, item.adminOnly)}
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

        {/* Bottom Helper Box */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            {isAdmin ? (
              <>
                <Shield className="w-4 h-4 text-violet-600" />
                <span>Perfil Administrador</span>
              </>
            ) : (
              <>
                <Info className="w-4 h-4 text-sky-600" />
                <span>Perfil USUÁRIO</span>
              </>
            )}
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {isAdmin
              ? 'Acesso total para criar e gerenciar usuários no CRM.'
              : 'Acesso restrito a "Meus Dados". Não pode alterar e-mail ou data de nascimento.'}
          </p>
        </div>
      </aside>
    </>
  );
};
