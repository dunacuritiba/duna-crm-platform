import React, { useState, useEffect } from 'react';
import type { Ticket, TicketComment, TicketStatus } from '../../types/ticket';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { MentionInput } from './MentionInput';
import { calculateSlaInfo } from '../../utils/sla';
import { fetchTicketComments, addTicketCommentInSupabase } from '../../services/ticketService';
import {
  Clock,
  User as UserIcon,
  Tag,
  Send,
  MessageSquare,
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  users: User[];
  currentUserId: string;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdateStatus,
  users,
  currentUserId,
}) => {
  if (!ticket) return null;

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load comments
  useEffect(() => {
    let isMounted = true;
    const loadComments = async () => {
      const data = await fetchTicketComments(ticket.id, users);
      if (isMounted) setComments(data);
    };
    loadComments();

    return () => {
      isMounted = false;
    };
  }, [ticket.id, users]);

  const sla = calculateSlaInfo(ticket.slaDeadline, ticket.createdAt);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(ticket.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMention = (userId: string) => {
    if (!mentionedUserIds.includes(userId)) {
      setMentionedUserIds([...mentionedUserIds, userId]);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await addTicketCommentInSupabase(
        {
          ticketId: ticket.id,
          authorId: currentUserId,
          content: commentText.trim(),
          mentionedUserIds,
        },
        users
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setMentionedUserIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const renderSlaBadge = () => {
    if (sla.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          {sla.remainingText} (Estourado)
        </span>
      );
    }
    if (sla.status === 'AT_RISK') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {sla.remainingText} (Em Risco)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {sla.remainingText} (No Prazo)
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${ticket.ticketNumber} • ${ticket.title}`}
      subtitle={`Aberto em ${new Date(ticket.createdAt).toLocaleString('pt-BR')} por ${
        ticket.creator?.name || 'Membro da equipe'
      }`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* SLA Status Bar Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">
                SLA Contratado: <strong>{ticket.slaHours} Horas</strong>
              </span>
            </div>
            <div>{renderSlaBadge()}</div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                sla.status === 'EXPIRED'
                  ? 'bg-rose-500 w-full'
                  : sla.status === 'AT_RISK'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${sla.status === 'EXPIRED' ? 100 : sla.percentageRemaining}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Início: {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>Limite Máximo: {new Date(ticket.slaDeadline).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Status Lifecycle & Assignment Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          {/* Status selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Status do Chamado
            </label>
            <select
              value={ticket.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ABERTO">🟡 ABERTO (Aguardando Atendimento)</option>
              <option value="EM_ANDAMENTO">🔵 EM ANDAMENTO</option>
              <option value="AGUARDANDO_USUARIO">🟠 AGUARDANDO RESPOSTA</option>
              <option value="RESOLVIDO">🟢 RESOLVIDO</option>
              <option value="FECHADO">⚫ FECHADO / ENCERRADO</option>
            </select>
          </div>

          {/* Assigned Attendant */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Responsável Designado
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 truncate">
                {ticket.assignedTo?.name || 'Aguardando atribuição'}
              </span>
            </div>
          </div>
        </div>

        {/* Description & Tags */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Descrição da Demanda
            </label>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {ticket.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments & Timeline Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Respostas e Linha do Tempo ({comments.length})
            </h4>
          </div>

          {/* Comments list */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Nenhum comentário registrado ainda. Envie uma resposta abaixo.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                        alt={comment.author?.name || 'Autor'}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {comment.author?.name || 'Colega'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                        {comment.author?.role || 'Equipe'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 whitespace-pre-wrap pl-7">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add comment form with MentionInput */}
          <form onSubmit={handleSendComment} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Adicionar Resposta ao Chamado (Digite @ para citar colegas):
            </label>
            <MentionInput
              value={commentText}
              onChange={setCommentText}
              onMention={handleMention}
              users={users}
              rows={2}
              placeholder="Digite sua resposta ou atualização de status... Use @ para marcar alguém"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingComment ? 'Enviando...' : 'Responder Chamado'}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
