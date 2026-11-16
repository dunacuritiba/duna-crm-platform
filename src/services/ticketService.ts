import { supabase } from './supabase';
import type { Ticket, TicketComment, CreateTicketInput, CreateTicketCommentInput, TicketStatus } from '../types/ticket';
import type { User } from '../types/user';

export function mapDbToTicket(row: any, allUsers: User[]): Ticket {
  const creator = allUsers.find((u) => u.id === row.creator_id);
  const assignedTo = row.assigned_to_id ? allUsers.find((u) => u.id === row.assigned_to_id) : undefined;

  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    slaHours: row.sla_hours,
    slaDeadline: row.sla_deadline,
    tags: row.tags || [],
    creatorId: row.creator_id,
    assignedToId: row.assigned_to_id || undefined,
    mentionedUserIds: row.mentioned_user_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    creator,
    assignedTo,
  };
}

export function mapDbToComment(row: any, allUsers: User[]): TicketComment {
  const author = allUsers.find((u) => u.id === row.author_id);
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    content: row.content,
    mentionedUserIds: row.mentioned_user_ids || [],
    createdAt: row.created_at,
    author,
  };
}

/**
 * Fetch all tickets from Supabase
 */
export async function fetchTicketsFromSupabase(allUsers: User[]): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from('crm_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => mapDbToTicket(row, allUsers));
  } catch (err) {
    console.warn('Erro ao buscar chamados:', err);
    return [];
  }
}

/**
 * Generate next ticket number (e.g. #CH-1001)
 */
async function generateNextTicketNumber(): Promise<string> {
  const { data } = await supabase
    .from('crm_tickets')
    .select('ticket_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return '#CH-1001';
  }

  const lastNum = data[0].ticket_number;
  const match = lastNum.match(/#CH-(\d+)/);
  if (match) {
    const nextSeq = parseInt(match[1], 10) + 1;
    return `#CH-${nextSeq}`;
  }

  return `#CH-${1000 + Math.floor(Math.random() * 9000)}`;
}

/**
 * Create a new ticket with automatic SLA deadline calculation
 */
export async function createTicketInSupabase(
  input: CreateTicketInput,
  allUsers: User[]
): Promise<Ticket> {
  const ticketNumber = await generateNextTicketNumber();

  // SLA deadline calculation: current time + slaHours
  const deadlineDate = new Date();
  deadlineDate.setHours(deadlineDate.getHours() + (input.slaHours || 24));

  const { data, error } = await supabase
    .from('crm_tickets')
    .insert({
      ticket_number: ticketNumber,
      title: input.title.trim(),
      description: input.description.trim(),
      status: 'ABERTO',
      priority: input.priority || 'MEDIA',
      sla_hours: input.slaHours || 24,
      sla_deadline: deadlineDate.toISOString(),
      tags: input.tags || [],
      creator_id: input.creatorId,
      assigned_to_id: input.assignedToId || null,
      mentioned_user_ids: input.mentionedUserIds || [],
    })
    .select('*')
    .single();

  if (error) throw error;

  // Dispatch notifications to mentioned users
  if (input.mentionedUserIds && input.mentionedUserIds.length > 0) {
    const creator = allUsers.find((u) => u.id === input.creatorId);
    const notificationsToInsert = input.mentionedUserIds
      .filter((uid) => uid !== input.creatorId)
      .map((uid) => ({
        title: `Marcado no chamado ${ticketNumber}`,
        message: `${creator?.name || 'Um colega'} marcou você no chamado: "${input.title.trim()}".`,
        type: input.priority === 'CRITICA' ? 'URGENTE' : 'INFO',
        target_type: 'USER',
        target_user_id: uid,
        created_by: input.creatorId,
      }));

    if (notificationsToInsert.length > 0) {
      await supabase.from('crm_notifications').insert(notificationsToInsert);
    }
  }

  return mapDbToTicket(data, allUsers);
}

/**
 * Update ticket status or assignee
 */
export async function updateTicketStatusInSupabase(
  ticketId: string,
  newStatus: TicketStatus,
  assignedToId?: string
): Promise<void> {
  const updates: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (assignedToId !== undefined) {
    updates.assigned_to_id = assignedToId || null;
  }

  const { error } = await supabase
    .from('crm_tickets')
    .update(updates)
    .eq('id', ticketId);

  if (error) throw error;
}

/**
 * Fetch comments for a specific ticket
 */
export async function fetchTicketComments(
  ticketId: string,
  allUsers: User[]
): Promise<TicketComment[]> {
  try {
    const { data, error } = await supabase
      .from('crm_ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => mapDbToComment(row, allUsers));
  } catch (err) {
    console.warn('Erro ao carregar comentários do chamado:', err);
    return [];
  }
}

/**
 * Add a comment to a ticket
 */
export async function addTicketCommentInSupabase(
  input: CreateTicketCommentInput,
  allUsers: User[]
): Promise<TicketComment> {
  const { data, error } = await supabase
    .from('crm_ticket_comments')
    .insert({
      ticket_id: input.ticketId,
      author_id: input.authorId,
      content: input.content.trim(),
      mentioned_user_ids: input.mentionedUserIds || [],
    })
    .select('*')
    .single();

  if (error) throw error;

  // Touch ticket updated_at and merge mentioned users if any
  const { data: currentTicket } = await supabase
    .from('crm_tickets')
    .select('ticket_number, title, mentioned_user_ids')
    .eq('id', input.ticketId)
    .single();

  const existingMentions = currentTicket?.mentioned_user_ids || [];
  const mergedMentions = Array.from(new Set([...existingMentions, ...(input.mentionedUserIds || [])]));

  await supabase
    .from('crm_tickets')
    .update({
      mentioned_user_ids: mergedMentions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.ticketId);

  // Send notifications to users mentioned in the comment
  if (input.mentionedUserIds && input.mentionedUserIds.length > 0) {
    const author = allUsers.find((u) => u.id === input.authorId);
    const notificationsToInsert = input.mentionedUserIds
      .filter((uid) => uid !== input.authorId)
      .map((uid) => ({
        title: `Citado no chamado ${currentTicket?.ticket_number || ''}`,
        message: `${author?.name || 'Um colega'} citou você em uma resposta do chamado: "${currentTicket?.title || ''}".`,
        type: 'INFO',
        target_type: 'USER',
        target_user_id: uid,
        created_by: input.authorId,
      }));

    if (notificationsToInsert.length > 0) {
      await supabase.from('crm_notifications').insert(notificationsToInsert);
    }
  }

  return mapDbToComment(data, allUsers);
}
