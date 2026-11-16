import { supabase } from './supabase';
import type { AppNotification, CreateNotificationInput } from '../types/notification';

export function mapDbToNotification(row: any, isRead = false): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type || 'INFO',
    targetType: row.target_type || 'ALL',
    targetRole: row.target_role || undefined,
    targetUserId: row.target_user_id || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    isRead,
  };
}

/**
 * Fetch all notifications visible to a given user
 */
export async function fetchUserNotifications(
  userId: string,
  userRole: string
): Promise<AppNotification[]> {
  try {
    // 1. Fetch notifications that target ALL, target the user's ROLE, or target this specific USER
    const { data: notifs, error } = await supabase
      .from('crm_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!notifs) return [];

    // Filter relevant to current user
    const filtered = notifs.filter((n: any) => {
      if (n.target_type === 'ALL') return true;
      if (n.target_type === 'ROLE' && n.target_role === userRole) return true;
      if (n.target_type === 'USER' && n.target_user_id === userId) return true;
      return false;
    });

    // 2. Fetch read receipts for this user
    const { data: reads } = await supabase
      .from('crm_notification_reads')
      .select('notification_id')
      .eq('user_id', userId);

    const readIds = new Set((reads || []).map((r: any) => r.notification_id));

    return filtered.map((n: any) => mapDbToNotification(n, readIds.has(n.id)));
  } catch (err) {
    console.warn('Erro ao buscar notificações:', err);
    return [];
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    await supabase.from('crm_notification_reads').upsert(
      {
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date().toISOString(),
      },
      { onConflict: 'notification_id,user_id' }
    );
  } catch (err) {
    console.warn('Erro ao marcar notificação como lida:', err);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  notificationIds: string[],
  userId: string
): Promise<void> {
  if (!notificationIds.length || !userId) return;
  try {
    const rows = notificationIds.map((id) => ({
      notification_id: id,
      user_id: userId,
      read_at: new Date().toISOString(),
    }));
    await supabase
      .from('crm_notification_reads')
      .upsert(rows, { onConflict: 'notification_id,user_id' });
  } catch (err) {
    console.warn('Erro ao marcar todas notificações como lidas:', err);
  }
}

/**
 * Create/Broadcast a notification (Admin)
 */
export async function createBroadcastNotification(
  input: CreateNotificationInput
): Promise<AppNotification> {
  const { data, error } = await supabase
    .from('crm_notifications')
    .insert({
      title: input.title,
      message: input.message,
      type: input.type,
      target_type: input.targetType,
      target_role: input.targetRole || null,
      target_user_id: input.targetUserId || null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapDbToNotification(data, false);
}
