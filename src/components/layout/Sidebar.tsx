import React, { useState, useEffect } from 'react';
import type { UserRole } from '../../types/user';
import { APP_CONFIG } from '../../config/version';
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  UserCheck,
  CalendarCheck,
  Briefcase,
  MessageSquare,
  LifeBuoy,
  ChevronDown,
  SlidersHorizontal,
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
  chatUnreadCount?: number;
  ticketMentionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isMobileOpen,
  onCloseMobile,
  chatUnreadCount = 0,
  ticketMentionCount = 0,
}) => {
  const isAdmin = userRole === 'ADMIN';
  const isAttendant = userRole === 'ATENDENTE';

  // Check if active tab belongs to the Management module
  const isManagementTab = ['users', 'clinics', 'portfolio', 'agendas', 'leads'].includes(currentTab);
  const [isManagementExpanded, setIsManagementExpanded] = useState<boolean>(true);

  // Auto-expand whenever a management submenu is active
  useEffect(() => {
    if (isManagementTab) {
      setIsManagementExpanded(true);
    }
  }, [isManagementTab]);

  // Management Submenus definition
  const managementSubItems = [
    {
      id: 'users' as NavTab,
      label: 'Gestão de Usuários',
      icon: Users,
      allowedRoles: ['ADMIN'] as UserRole[],
    },
    {
      id: 'clinics' as NavTab,
      label: isAttendant ? 'Minha Carteira' : 'Clínicas Médicas',
      icon: isAttendant ? Briefcase : Building2,
      allowedRoles: ['ADMIN', 'ATENDENTE'] as UserRole[],
    },
    {
      id: 'portfolio' as NavTab,
      label: 'Gestão de Carteiras',
      icon: Briefcase,
      allowedRoles: ['ADMIN'] as UserRole[],
    },
    {
      id: 'agendas' as NavTab,
      label: 'Gestão de Agendas',
      icon: CalendarCheck,
      allowedRoles: ['ADMIN', 'ATENDENTE'] as UserRole[],
    },
    {
      id: 'leads' as NavTab,
      label: 'Gestão de Leads',
      icon: Target,
      allowedRoles: ['ADMIN'] as UserRole[],
    },
  ].filter((item) => item.allowedRoles.includes(userRole));

  const hasManagementAccess = managementSubItems.length > 0;

  const handleManagementToggle = () => {
    if (!isManagementExpanded) {
      setIsManagementExpanded(true);
      if (!isManagementTab) {
        const first = managementSubItems[0];
        if (first) {
          onSelectTab(first.id);
          onCloseMobile();
        }
      }
    } else {
      setIsManagementExpanded((prev) => !prev);
    }
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
        <div className="space-y-5 overflow-y-auto pr-0.5">
          {/* Section title */}
          <div className="px-3 pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navegação
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* 1. Visão Geral (Overview) - Admin only */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onSelectTab('overview');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  currentTab === 'overview'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentTab === 'overview' ? 'text-indigo-600' : ''}`} />
                  <span className="truncate">Visão Geral</span>
                </div>
              </button>
            )}

            {/* 2. Parent "Gestão" with Submenus */}
            {hasManagementAccess && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleManagementToggle}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isManagementTab
                      ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SlidersHorizontal
                      className={`w-4 h-4 shrink-0 ${isManagementTab ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    <span className="truncate">Gestão</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      {managementSubItems.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isManagementExpanded ? 'rotate-0 text-slate-700' : '-rotate-90 text-slate-400'
                      }`}
                    />
                  </div>
                </button>

                {/* Submenus of Gestão */}
                {isManagementExpanded && (
                  <div className="pl-3 py-1 space-y-1 border-l-2 border-indigo-100 ml-4.5 my-1 animate-in slide-in-from-top-1 duration-150">
                    {managementSubItems.map((subItem) => {
                      const isSubActive = currentTab === subItem.id;
                      const SubIcon = subItem.icon;

                      return (
                        <button
                          key={subItem.id}
                          type="button"
                          onClick={() => {
                            onSelectTab(subItem.id);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                            isSubActive
                              ? 'bg-indigo-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{subItem.label}</span>
                          </div>
                          {isSubActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Section Divider: Comunicação & Atendimento */}
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Comunicação
              </p>
            </div>

            {/* 3. Chat Interno */}
            <button
              type="button"
              onClick={() => {
                onSelectTab('chat');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                currentTab === 'chat'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MessageSquare className={`w-4 h-4 shrink-0 ${currentTab === 'chat' ? 'text-indigo-600' : ''}`} />
                <span className="truncate">Chat Interno</span>
              </div>
              {chatUnreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white min-w-4.5 shadow-2xs leading-none">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
            </button>

            {/* 4. Suporte & Chamados */}
            <button
              type="button"
              onClick={() => {
                onSelectTab('support');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                currentTab === 'support'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LifeBuoy className={`w-4 h-4 shrink-0 ${currentTab === 'support' ? 'text-indigo-600' : ''}`} />
                <span className="truncate">Suporte & Chamados</span>
              </div>
              {ticketMentionCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white min-w-5 shadow-2xs leading-none">
                  <span className="text-[9px] font-black">@</span>
                  <span>{ticketMentionCount > 9 ? '9+' : ticketMentionCount}</span>
                </span>
              )}
            </button>

            {/* Section Divider: Pessoal */}
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Conta
              </p>
            </div>

            {/* 5. Meus Dados */}
            <button
              type="button"
              onClick={() => {
                onSelectTab('profile');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                currentTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserCheck className={`w-4 h-4 shrink-0 ${currentTab === 'profile' ? 'text-indigo-600' : ''}`} />
                <span className="truncate">Meus Dados</span>
              </div>
            </button>
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
