export type NotificationType = 'INFO' | 'ALERTA' | 'URGENTE' | 'SISTEMA';
export type NotificationTargetType = 'ALL' | 'ROLE' | 'USER';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetRole?: string;
  targetUserId?: string;
  createdBy: string;
  createdAt: string;
  isRead?: boolean;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetRole?: string;
  targetUserId?: string;
  createdBy: string;
}
