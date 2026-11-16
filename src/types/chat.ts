import type { User } from './user';

export interface ChatChannel {
  id: string;
  name: string;
  isGroup: boolean;
  department?: string;
  createdBy?: string;
  createdAt: string;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  // For 1-on-1 direct channels
  otherUser?: User;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: User;
}

export interface ChatMember {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string;
}

export interface CreateMessageInput {
  channelId: string;
  senderId: string;
  content: string;
}

export interface CreateDirectChannelInput {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
}

export interface CreateGroupChannelInput {
  name: string;
  department?: string;
  createdBy: string;
  memberIds: string[];
}
