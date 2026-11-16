import React, { useState, useEffect, useRef } from 'react';
import type { ChatChannel, ChatMessage } from '../../types/chat';
import type { User } from '../../types/user';
import { supabase } from '../../services/supabase';
import {
  fetchUserChannels,
  fetchChannelMessages,
  sendChatMessage,
  getOrCreateDirectChannel,
  createGroupChannel,
  mapDbToMessage,
} from '../../services/chatService';
import { isUserOnline } from '../../services/userService';
import { NewChatModal } from './NewChatModal';
import {
  Hash,
  Send,
  Plus,
  Search,
  MessageSquare,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  onlineUserIds?: Set<string>;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, allUsers, onlineUserIds }) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load channels on mount
  useEffect(() => {
    let isMounted = true;
    const loadChannels = async () => {
      const data = await fetchUserChannels(currentUser.id, allUsers);
      if (isMounted) {
        setChannels(data);
        if (!activeChannel && data.length > 0) {
          // Default to Atendimento or first group
          const defaultChannel = data.find((c) => c.name.toLowerCase().includes('atendimento')) || data[0];
          setActiveChannel(defaultChannel);
        }
      }
    };
    loadChannels();

    return () => {
      isMounted = false;
    };
  }, [currentUser.id, allUsers]);

  // Load messages and subscribe to active channel
  useEffect(() => {
    if (!activeChannel) return;

    let isMounted = true;
    const loadMessages = async () => {
      const msgs = await fetchChannelMessages(activeChannel.id, allUsers);
      if (isMounted) {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    loadMessages();

    // Subscribe to real-time messages on this channel
    const channelSub = supabase
      .channel(`chat_channel_${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_chat_messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        (payload) => {
          const sender = allUsers.find((u) => u.id === payload.new.sender_id);
          const newMsg = mapDbToMessage(payload.new, sender);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [activeChannel?.id, allUsers]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendChatMessage(
        {
          channelId: activeChannel.id,
          senderId: currentUser.id,
          content: text,
        },
        allUsers
      );
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartDirectChat = async (targetUser: User) => {
    const channel = await getOrCreateDirectChannel(
      currentUser.id,
      targetUser.id,
      targetUser.name,
      allUsers
    );
    setChannels((prev) => {
      if (prev.some((c) => c.id === channel.id)) return prev;
      return [...prev, channel];
    });
    setActiveChannel(channel);
    setIsMobileListOpen(false);
  };

  const handleCreateGroup = async (name: string, dept: string) => {
    const channel = await createGroupChannel(name, dept, currentUser.id, [currentUser.id]);
    setChannels((prev) => [...prev, channel]);
    setActiveChannel(channel);
    setIsMobileListOpen(false);
  };

  // Channel grouping
  const groupChannels = channels.filter((c) => c.isGroup);
  const directChannels = channels.filter((c) => !c.isGroup);

  const filteredGroupChannels = groupChannels.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredDirectChannels = directChannels.filter((c) =>
    (c.otherUser?.name || c.name).toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden h-[calc(100vh-140px)] min-h-[550px] flex">
      {/* Left Sidebar: Channels & Direct chats */}
      <div
        className={`${
          isMobileListOpen ? 'flex' : 'hidden md:flex'
        } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-slate-50/60 shrink-0`}
      >
        {/* Top bar */}
        <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Chat Interno</h2>
          </div>

          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Conversa
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200/60 bg-white/70">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar canal ou pessoa..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-transparent focus:border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:bg-white transition"
            />
          </div>
        </div>

        {/* Channel Lists */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Group Channels Section */}
          <div>
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Canais em Grupo</span>
              <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full font-semibold">
                {groupChannels.length}
              </span>
            </div>
            <div className="mt-1 space-y-0.5">
              {filteredGroupChannels.map((channel) => {
                const isActive = activeChannel?.id === channel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannel(channel);
                      setIsMobileListOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between group ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Hash
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="text-xs truncate">{channel.name}</span>
                    </div>

                    {channel.department && (
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                          isActive ? 'bg-indigo-700/60 text-white' : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {channel.department}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct 1-on-1 Messages Section */}
          <div>
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Mensagens Diretas</span>
              <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full font-semibold">
                {directChannels.length}
              </span>
            </div>
            <div className="mt-1 space-y-0.5">
              {filteredDirectChannels.length === 0 ? (
                <p className="px-3 py-3 text-[11px] text-slate-400 text-center">
                  Nenhuma conversa direta aberta. Inicie em &quot;Nova Conversa&quot;.
                </p>
              ) : (
                filteredDirectChannels.map((channel) => {
                  const isActive = activeChannel?.id === channel.id;
                  const otherUser = channel.otherUser;
                  const online = otherUser ? isUserOnline(otherUser, currentUser.id, onlineUserIds) : false;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setActiveChannel(channel);
                        setIsMobileListOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between group ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="relative inline-block shrink-0">
                          {otherUser?.avatar ? (
                            <img
                              src={otherUser.avatar}
                              alt={otherUser.name}
                              className="w-7 h-7 rounded-full object-cover border border-white shadow-2xs"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold">
                              {otherUser?.name?.[0] || 'U'}
                            </div>
                          )}
                          {online && (
                            <span
                              className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full shadow-2xs"
                              title="Online agora"
                            />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs truncate">{otherUser?.name || channel.name}</p>
                          <p
                            className={`text-[10px] truncate ${
                              isActive ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            {otherUser?.department || 'Equipe DunaCRM'}
                          </p>
                        </div>
                      </div>

                      {online && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isActive ? 'bg-white' : 'bg-emerald-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Active Chat Conversation */}
      <div
        className={`${
          !isMobileListOpen ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col bg-white overflow-hidden`}
      >
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setIsMobileListOpen(true)}
                  className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5 min-w-0">
                  {activeChannel.isGroup ? (
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Hash className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="relative inline-block shrink-0">
                      <img
                        src={activeChannel.otherUser?.avatar || currentUser.avatar}
                        alt="Avatar"
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                      />
                      {activeChannel.otherUser &&
                        isUserOnline(activeChannel.otherUser, currentUser.id, onlineUserIds) && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-2xs"
                            title="Online agora"
                          />
                        )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {activeChannel.isGroup
                          ? `# ${activeChannel.name}`
                          : activeChannel.otherUser?.name || activeChannel.name}
                      </h3>
                      {activeChannel.isGroup ? (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.2 rounded-full">
                          Canal Público
                        </span>
                      ) : activeChannel.otherUser &&
                        isUserOnline(activeChannel.otherUser, currentUser.id, onlineUserIds) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Offline</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {activeChannel.isGroup
                        ? `Departamento: ${activeChannel.department || 'Geral'}`
                        : activeChannel.otherUser?.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Início da conversa</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Nenhuma mensagem ainda neste canal. Envie uma mensagem para iniciar o diálogo com
                    sua equipe.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  const sender = msg.sender || allUsers.find((u) => u.id === msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <img
                          src={sender?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                          alt={sender?.name || 'Usuário'}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      )}

                      <div
                        className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {!isMine && (
                          <p className="text-[10px] font-bold text-indigo-600 mb-0.5">
                            {sender?.name || 'Colega'}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            isMine ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Mensagem para ${
                  activeChannel.isGroup ? `#${activeChannel.name}` : activeChannel.otherUser?.name || 'conversa'
                }...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl shadow-xs transition shrink-0 cursor-pointer"
                aria-label="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">Selecione uma conversa</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Escolha um canal em grupo à esquerda ou inicie uma conversa privada direta com um colega.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        users={allUsers}
        currentUserId={currentUser.id}
        onlineUserIds={onlineUserIds}
        onStartDirectChat={handleStartDirectChat}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};
