import React, { useState } from 'react';
import type { NotificationType, NotificationTargetType, CreateNotificationInput } from '../../types/notification';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { Send, Users, Shield, User as UserIcon, AlertCircle, Info, Flame, Cpu } from 'lucide-react';

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateNotificationInput) => Promise<void>;
  users: User[];
  currentUserId: string;
}

export const BroadcastNotificationModal: React.FC<BroadcastNotificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
  currentUserId,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('INFO');
  const [targetType, setTargetType] = useState<NotificationTargetType>('ALL');
  const [targetRole, setTargetRole] = useState<'ATENDENTE' | 'USUARIO' | 'ADMIN'>('ATENDENTE');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        message: message.trim(),
        type,
        targetType,
        targetRole: targetType === 'ROLE' ? targetRole : undefined,
        targetUserId: targetType === 'USER' ? targetUserId : undefined,
        createdBy: currentUserId,
      });
      // reset
      setTitle('');
      setMessage('');
      setType('INFO');
      setTargetType('ALL');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disparar Comunicado / Notificação"
      subtitle="Envie avisos operacionais, alertas urgentes ou comunicados para a equipe."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type / Severity Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Tipo de Comunicado
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setType('INFO')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                type === 'INFO'
                  ? 'border-sky-500 bg-sky-50/80 text-sky-900 ring-2 ring-sky-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Informativo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Avisos gerais</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('ALERTA')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                type === 'ALERTA'
                  ? 'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Alerta</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Atenção</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('URGENTE')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                type === 'URGENTE'
                  ? 'border-rose-500 bg-rose-50/80 text-rose-900 ring-2 ring-rose-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Urgente</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ação imediata</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('SISTEMA')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                type === 'SISTEMA'
                  ? 'border-violet-500 bg-violet-50/80 text-violet-900 ring-2 ring-violet-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Cpu className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Sistema</p>
                <p className="text-[10px] text-slate-400 mt-0.5">DunaCRM</p>
              </div>
            </button>
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Público-Alvo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTargetType('ALL')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                targetType === 'ALL'
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Todos os Usuários</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Broadcast geral</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('ROLE')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                targetType === 'ROLE'
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Por Grupo / Perfil</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Atendentes / Usuários</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('USER')}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                targetType === 'USER'
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-none">Pessoa Específica</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Destinatário único</p>
              </div>
            </button>
          </div>

          {/* Role selector subfield */}
          {targetType === 'ROLE' && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in">
              <label htmlFor="broadcast-target-role" className="block text-xs font-medium text-slate-600">Selecione o Grupo:</label>
              <select
                id="broadcast-target-role"
                name="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="ATENDENTE">Apenas Equipe de Atendimento (ATENDENTE)</option>
                <option value="USUARIO">Apenas Usuários Básicos (USUÁRIO)</option>
                <option value="ADMIN">Apenas Administradores (ADMIN)</option>
              </select>
            </div>
          )}

          {/* User selector subfield */}
          {targetType === 'USER' && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in">
              <label htmlFor="broadcast-target-user" className="block text-xs font-medium text-slate-600">Selecione o Usuário:</label>
              <select
                id="broadcast-target-user"
                name="targetUserId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Selecione um usuário...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="broadcast-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Título do Comunicado *
          </label>
          <input
            id="broadcast-title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Atualização nos contratos de clínicas parceiras..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="broadcast-message" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mensagem Completa *
          </label>
          <textarea
            id="broadcast-message"
            name="message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva as orientações, procedimentos ou informações que todos precisam saber..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !message.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Disparando...' : 'Disparar Notificação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
