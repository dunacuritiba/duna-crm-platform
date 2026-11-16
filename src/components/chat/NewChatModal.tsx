import React, { useState } from 'react';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { isUserOnline } from '../../services/userService';
import { Search, MessageSquare, Hash, Users } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  onlineUserIds?: Set<string>;
  onStartDirectChat: (user: User) => void;
  onCreateGroup?: (name: string, department: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onlineUserIds,
  onStartDirectChat,
  onCreateGroup,
}) => {
  const [tab, setTab] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [department, setDepartment] = useState('ATENDIMENTO');

  const otherUsers = users.filter((u) => u.id !== currentUserId && u.status === 'ATIVO');
  const filteredUsers = otherUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !onCreateGroup) return;
    onCreateGroup(groupName.trim(), department);
    setGroupName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Nova Conversa"
      subtitle="Converse diretamente com um membro da equipe ou crie um canal de grupo."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('DIRECT')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'DIRECT' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Mensagem Direta (1 a 1)
          </button>
          <button
            type="button"
            onClick={() => setTab('GROUP')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'GROUP' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Criar Canal em Grupo
          </button>
        </div>

        {tab === 'DIRECT' ? (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar usuário por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
              />
            </div>

            {/* User list */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const online = isUserOnline(user, currentUserId, onlineUserIds);

                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onStartDirectChat(user);
                        onClose();
                      }}
                      className="w-full p-3 flex items-center justify-between hover:bg-slate-50 text-left transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative inline-block shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          {online && (
                            <span
                              className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs"
                              title="Online agora"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                        {online && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            Online
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Canal *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  #
                </span>
                <input
                  type="text"
                  required
                  placeholder="ex: Suporte-Clinicas, Equipe-Plantao..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Departamento Vinculado
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
              >
                <option value="ATENDIMENTO">Atendimento</option>
                <option value="GERAL">Geral</option>
                <option value="ADMIN">Administração</option>
                <option value="FINANCEIRO">Financeiro</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!groupName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Users className="w-3.5 h-3.5" />
                Criar Canal
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
