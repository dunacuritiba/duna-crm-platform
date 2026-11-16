import React, { useState } from 'react';
import type { TicketPriority, CreateTicketInput } from '../../types/ticket';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { MentionInput } from './MentionInput';
import {
  Tag,
  Clock,
  AlertTriangle,
  UserCheck,
  Send,
  Plus,
} from 'lucide-react';

interface TicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTicketInput) => Promise<void>;
  users: User[];
  currentUserId: string;
}

const PREDEFINED_TAGS = ['financeiro', 'bug', 'atendimento', 'duvida', 'urgente', 'contrato', 'sistema'];

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
  currentUserId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIA');
  const [slaHours, setSlaHours] = useState<number>(24);
  const [selectedTags, setSelectedTags] = useState<string[]>(['atendimento']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
    }
    setCustomTagInput('');
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleMention = (userId: string) => {
    if (!mentionedUserIds.includes(userId)) {
      setMentionedUserIds([...mentionedUserIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        slaHours,
        tags: selectedTags,
        creatorId: currentUserId,
        assignedToId: assignedToId || undefined,
        mentionedUserIds,
      });

      // reset
      setTitle('');
      setDescription('');
      setPriority('MEDIA');
      setSlaHours(24);
      setSelectedTags(['atendimento']);
      setAssignedToId('');
      setMentionedUserIds([]);
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
      title="Abrir Novo Chamado de Suporte"
      subtitle="Defina o prazo de SLA, prioridade, tags e mencione com @ os responsáveis."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Título do Chamado *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Erro ao sincronizar contrato da Clínica São Lucas..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
          />
        </div>

        {/* SLA and Priority Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SLA Hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              SLA de Atendimento (Prazo Máximo)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[2, 4, 8, 24, 48].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setSlaHours(hours)}
                  className={`py-2 text-xs font-bold rounded-xl border text-center transition ${
                    slaHours === hours
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Contagem regressiva automática a partir do envio.
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Nível de Prioridade
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as TicketPriority[]).map((p) => {
                const isSelected = priority === p;
                let colorClass = 'bg-slate-50 text-slate-700 border-slate-200';
                if (isSelected) {
                  if (p === 'BAIXA') colorClass = 'bg-slate-800 text-white border-slate-800';
                  if (p === 'MEDIA') colorClass = 'bg-amber-600 text-white border-amber-600';
                  if (p === 'ALTA') colorClass = 'bg-orange-600 text-white border-orange-600';
                  if (p === 'CRITICA') colorClass = 'bg-rose-600 text-white border-rose-600';
                }

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-[11px] font-bold rounded-xl border text-center transition ${colorClass}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Description with @ MentionInput */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Descrição Detalhada (Use @ para marcar colegas) *
          </label>
          <MentionInput
            value={description}
            onChange={setDescription}
            onMention={handleMention}
            users={users}
            required
            rows={4}
            placeholder="Descreva a solicitação, anomalia ou necessidade. Digite @ para citar qualquer membro..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            Tags do Chamado
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PREDEFINED_TAGS.map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleTag(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  #{t}
                </button>
              );
            })}
          </div>

          {/* Add custom tag */}
          <div className="flex items-center gap-2 max-w-xs">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                #
              </span>
              <input
                type="text"
                placeholder="Nova tag..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                className="w-full pl-6 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Assign To (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Atribuir Responsável (Opcional)
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
          >
            <option value="">Nenhum (Triagem geral da equipe)</option>
            {users
              .filter((u) => u.status === 'ATIVO')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role} - {u.department || 'Geral'})
                </option>
              ))}
          </select>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Criando Chamado...' : 'Abrir Chamado'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
