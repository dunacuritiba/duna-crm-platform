import React from 'react';
import type { AppNotification } from '../../types/notification';
import {
  X,
  CheckCheck,
  PlusCircle,
  Bell,
  AlertCircle,
  Info,
  Flame,
  Cpu,
  Clock,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onOpenBroadcastModal?: () => void;
  isAdmin: boolean;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenBroadcastModal,
  isAdmin,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'URGENTE':
        return <Flame className="w-4 h-4 text-rose-600" />;
      case 'ALERTA':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'SISTEMA':
        return <Cpu className="w-4 h-4 text-violet-600" />;
      default:
        return <Info className="w-4 h-4 text-sky-600" />;
    }
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'URGENTE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            URGENTE
          </span>
        );
      case 'ALERTA':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            ALERTA
          </span>
        );
      case 'SISTEMA':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
            SISTEMA
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            INFO
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Notificações
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Comunicados e avisos da plataforma</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          {unreadCount > 0 ? (
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-medium transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar lidas ({unreadCount})
            </button>
          ) : (
            <span className="text-slate-400">Tudo em dia</span>
          )}

          {isAdmin && onOpenBroadcastModal && (
            <button
              onClick={() => {
                onClose();
                onOpenBroadcastModal();
              }}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Novo Comunicado
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium">Nenhuma notificação por enquanto</p>
              <p className="text-xs text-slate-400">Você será avisado quando houver comunicados.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && onMarkAsRead(notif.id)}
                className={`p-3.5 rounded-xl transition cursor-pointer relative ${
                  notif.isRead ? 'bg-white hover:bg-slate-50/70' : 'bg-indigo-50/40 hover:bg-indigo-50/60'
                }`}
              >
                {!notif.isRead && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600" />
                )}

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs mt-0.5 shrink-0">
                    {renderTypeIcon(notif.type)}
                  </div>

                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      {renderTypeBadge(notif.type)}
                    </div>
                    <h3
                      className={`text-xs ${
                        notif.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
