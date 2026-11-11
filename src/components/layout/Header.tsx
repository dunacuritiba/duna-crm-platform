import React, { useState } from 'react';
import type { User } from '../../types/user';
import { RoleBadge } from '../common/Badge';
import {
  Menu,
  ChevronDown,
  Layers,
  UserPlus,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onOpenCreateModal: () => void;
  onToggleSidebarMobile: () => void;
  onLogout: () => void;
  onGoToProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenCreateModal,
  onToggleSidebarMobile,
  onLogout,
  onGoToProfile,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Brand & Mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-base sm:text-lg tracking-tight">
              Nexus<span className="text-indigo-600">CRM</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Clean Suite
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick New User (Admin only) */}
        {currentUser.role === 'ADMIN' && (
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/70 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Novo Usuário
          </button>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-medium text-slate-500">
                  {currentUser.role === 'ADMIN' ? 'Administrador' : 'Usuário (Restrito)'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Menu Popover */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95">
                {/* User card info */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-white shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1">
                      <RoleBadge role={currentUser.role} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="space-y-1">
                  {onGoToProfile && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onGoToProfile();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Meus Dados / Perfil
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair da Conta
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Direct Logout Icon Button */}
        <button
          onClick={onLogout}
          title="Fazer Logout"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
