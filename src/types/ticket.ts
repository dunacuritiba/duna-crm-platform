import type { User } from './user';

export type TicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO_USUARIO' | 'RESOLVIDO' | 'FECHADO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  slaHours: number;
  slaDeadline: string;
  tags: string[];
  creatorId: string;
  assignedToId?: string;
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
  creator?: User;
  assignedTo?: User;
  commentsCount?: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  mentionedUserIds: string[];
  createdAt: string;
  author?: User;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  slaHours: number;
  tags: string[];
  creatorId: string;
  assignedToId?: string;
  mentionedUserIds: string[];
}

export interface CreateTicketCommentInput {
  ticketId: string;
  authorId: string;
  content: string;
  mentionedUserIds: string[];
}
