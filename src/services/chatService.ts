import { supabase } from './supabase';
import type { ChatChannel, ChatMessage, CreateMessageInput } from '../types/chat';
import type { User } from '../types/user';

export function mapDbToChannel(row: any, otherUser?: User, unreadCount = 0): ChatChannel {
  return {
    id: row.id,
    name: row.name,
    isGroup: row.is_group ?? false,
    department: row.department || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    otherUser,
    unreadCount,
  };
}

export function mapDbToMessage(row: any, sender?: User): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    sender,
  };
}

/**
 * Fetch all available channels for a user:
 * - Public group channels
 * - Direct channels where user is a member
 */
export async function fetchUserChannels(
  currentUserId: string,
  allUsers: User[]
): Promise<ChatChannel[]> {
  try {
    // 1. Fetch public groups
    const { data: publicGroups, error: groupErr } = await supabase
      .from('crm_chat_channels')
      .select('*')
      .eq('is_group', true)
      .order('created_at', { ascending: true });

    if (groupErr) throw groupErr;

    // 2. Fetch direct channels where currentUserId is a member
    const { data: myMemberships, error: memberErr } = await supabase
      .from('crm_chat_members')
      .select('channel_id')
      .eq('user_id', currentUserId);

    if (memberErr) throw memberErr;

    const myChannelIds = (myMemberships || []).map((m: any) => m.channel_id);

    let directChannels: any[] = [];
    if (myChannelIds.length > 0) {
      const { data: directData } = await supabase
        .from('crm_chat_channels')
        .select('*')
        .in('id', myChannelIds)
        .eq('is_group', false);
      directChannels = directData || [];
    }

    // 3. For direct channels, find the other participant
    let allMembersForDirect: any[] = [];
    if (directChannels.length > 0) {
      const { data: membersData } = await supabase
        .from('crm_chat_members')
        .select('*')
        .in('channel_id', directChannels.map((c) => c.id));
      allMembersForDirect = membersData || [];
    }

    // 4. Build channel list
    const result: ChatChannel[] = [];

    // Add groups
    for (const g of publicGroups || []) {
      result.push(mapDbToChannel(g));
    }

    // Add direct channels
    for (const dc of directChannels) {
      const channelMembers = allMembersForDirect.filter((m) => m.channel_id === dc.id);
      const otherMember = channelMembers.find((m) => m.user_id !== currentUserId);
      const otherUser = otherMember ? allUsers.find((u) => u.id === otherMember.user_id) : undefined;
      result.push(mapDbToChannel(dc, otherUser));
    }

    return result;
  } catch (err) {
    console.warn('Erro ao carregar canais de chat:', err);
    return [];
  }
}

/**
 * Open or create a direct 1-to-1 chat channel between two users
 */
export async function getOrCreateDirectChannel(
  currentUserId: string,
  targetUserId: string,
  targetUserName: string,
  allUsers: User[]
): Promise<ChatChannel> {
  // Check if a direct channel already exists between these 2 users
  const { data: myMemberships } = await supabase
    .from('crm_chat_members')
    .select('channel_id')
    .eq('user_id', currentUserId);

  const { data: targetMemberships } = await supabase
    .from('crm_chat_members')
    .select('channel_id')
    .eq('user_id', targetUserId);

  const myChannels = new Set((myMemberships || []).map((m: any) => m.channel_id));
  const commonChannelId = (targetMemberships || []).find((m: any) => myChannels.has(m.channel_id))?.channel_id;

  if (commonChannelId) {
    // Check if it's a direct channel
    const { data: channelData } = await supabase
      .from('crm_chat_channels')
      .select('*')
      .eq('id', commonChannelId)
      .eq('is_group', false)
      .single();

    if (channelData) {
      const otherUser = allUsers.find((u) => u.id === targetUserId);
      return mapDbToChannel(channelData, otherUser);
    }
  }

  // Otherwise, create a new direct channel
  const { data: newChannel, error: createErr } = await supabase
    .from('crm_chat_channels')
    .insert({
      name: `Chat com ${targetUserName}`,
      is_group: false,
      created_by: currentUserId,
    })
    .select('*')
    .single();

  if (createErr) throw createErr;

  // Add both members
  await supabase.from('crm_chat_members').insert([
    { channel_id: newChannel.id, user_id: currentUserId },
    { channel_id: newChannel.id, user_id: targetUserId },
  ]);

  const otherUser = allUsers.find((u) => u.id === targetUserId);
  return mapDbToChannel(newChannel, otherUser);
}

/**
 * Fetch messages for a specific channel
 */
export async function fetchChannelMessages(
  channelId: string,
  allUsers: User[]
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('crm_chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => {
      const sender = allUsers.find((u) => u.id === row.sender_id);
      return mapDbToMessage(row, sender);
    });
  } catch (err) {
    console.warn('Erro ao carregar mensagens:', err);
    return [];
  }
}

/**
 * Send a message to a channel
 */
export async function sendChatMessage(
  input: CreateMessageInput,
  allUsers: User[]
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('crm_chat_messages')
    .insert({
      channel_id: input.channelId,
      sender_id: input.senderId,
      content: input.content.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;
  const sender = allUsers.find((u) => u.id === data.sender_id);
  return mapDbToMessage(data, sender);
}

/**
 * Create a new group channel
 */
export async function createGroupChannel(
  name: string,
  department: string | undefined,
  createdBy: string,
  memberIds: string[]
): Promise<ChatChannel> {
  const { data: channel, error } = await supabase
    .from('crm_chat_channels')
    .insert({
      name: name.trim(),
      is_group: true,
      department: department || 'GERAL',
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error) throw error;

  // Add members if provided
  if (memberIds.length > 0) {
    const rows = memberIds.map((uid) => ({
      channel_id: channel.id,
      user_id: uid,
    }));
    await supabase.from('crm_chat_members').insert(rows);
  }

  return mapDbToChannel(channel);
}
