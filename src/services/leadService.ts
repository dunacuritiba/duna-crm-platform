import { supabase } from './supabase';
import type { Lead, CreateLeadInput, LeadStatus } from '../types/lead';
import type { MedicalClinic } from '../types/clinic';
import { createClinicInSupabase } from './clinicService';

export function mapDbToLead(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name || undefined,
    tradeName: row.trade_name || undefined,
    contactName: row.contact_name || undefined,
    contactRole: row.contact_role || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    cnpj: row.cnpj || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    leadType: (row.lead_type as Lead['leadType']) || 'CLINICA',
    status: (row.status as Lead['status']) || 'NOVO',
    temperature: (row.temperature as Lead['temperature']) || 'MORNO',
    source: (row.source as Lead['source']) || 'OUTBOUND',
    estimatedValue: row.estimated_value ? Number(row.estimated_value) : undefined,
    lossReason: row.loss_reason || undefined,
    nextFollowUp: row.next_follow_up || undefined,
    notes: row.notes || undefined,
    convertedClinicId: row.converted_clinic_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all leads ordered by recent creation
 */
export async function fetchLeadsFromSupabase(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar leads do Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbToLead);
  } catch (err: any) {
    console.error('Falha geral ao buscar leads:', err);
    return [];
  }
}

/**
 * Create a new lead in Supabase
 */
export async function createLeadInSupabase(input: CreateLeadInput): Promise<Lead> {
  const insertPayload = {
    name: input.name.trim(),
    company_name: input.companyName?.trim() || null,
    trade_name: input.tradeName?.trim() || null,
    contact_name: input.contactName?.trim() || null,
    contact_role: input.contactRole?.trim() || null,
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    cnpj: input.cnpj?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim().toUpperCase() || null,
    lead_type: input.leadType || 'CLINICA',
    status: input.status || 'NOVO',
    temperature: input.temperature || 'MORNO',
    source: input.source || 'OUTBOUND',
    estimated_value: input.estimatedValue !== undefined ? input.estimatedValue : null,
    loss_reason: input.lossReason?.trim() || null,
    next_follow_up: input.nextFollowUp || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('crm_leads')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar lead: ${error.message}`);
  }

  return mapDbToLead(data);
}

/**
 * Update an existing lead
 */
export async function updateLeadInSupabase(
  id: string,
  updates: Partial<CreateLeadInput>
): Promise<Lead> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updatePayload.name = updates.name.trim();
  if (updates.companyName !== undefined) updatePayload.company_name = updates.companyName?.trim() || null;
  if (updates.tradeName !== undefined) updatePayload.trade_name = updates.tradeName?.trim() || null;
  if (updates.contactName !== undefined) updatePayload.contact_name = updates.contactName?.trim() || null;
  if (updates.contactRole !== undefined) updatePayload.contact_role = updates.contactRole?.trim() || null;
  if (updates.email !== undefined) updatePayload.email = updates.email?.trim().toLowerCase() || null;
  if (updates.phone !== undefined) updatePayload.phone = updates.phone?.trim() || null;
  if (updates.cnpj !== undefined) updatePayload.cnpj = updates.cnpj?.trim() || null;
  if (updates.city !== undefined) updatePayload.city = updates.city?.trim() || null;
  if (updates.state !== undefined) updatePayload.state = updates.state?.trim().toUpperCase() || null;
  if (updates.leadType !== undefined) updatePayload.lead_type = updates.leadType;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.temperature !== undefined) updatePayload.temperature = updates.temperature;
  if (updates.source !== undefined) updatePayload.source = updates.source;
  if (updates.estimatedValue !== undefined) updatePayload.estimated_value = updates.estimatedValue;
  if (updates.lossReason !== undefined) updatePayload.loss_reason = updates.lossReason?.trim() || null;
  if (updates.nextFollowUp !== undefined) updatePayload.next_follow_up = updates.nextFollowUp || null;
  if (updates.notes !== undefined) updatePayload.notes = updates.notes?.trim() || null;

  const { data, error } = await supabase
    .from('crm_leads')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar lead: ${error.message}`);
  }

  return mapDbToLead(data);
}

/**
 * Fast status change (e.g. dragging in Kanban or changing status badge)
 */
export async function updateLeadStatusInSupabase(
  id: string,
  status: LeadStatus,
  lossReason?: string
): Promise<Lead> {
  return updateLeadInSupabase(id, {
    status,
    lossReason: status === 'PERDIDO' ? lossReason : undefined,
  });
}

/**
 * Delete a lead
 */
export async function deleteLeadInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('crm_leads').delete().eq('id', id);
  if (error) {
    throw new Error(`Erro ao excluir lead: ${error.message}`);
  }
}

/**
 * Convert a won Lead into an active/lead Medical Clinic in crm_clinics!
 */
export async function convertLeadToClinicInSupabase(
  lead: Lead,
  technicalResponsibleCrm: string,
  specialties: string[] = ['Clínica Geral']
): Promise<{ clinic: MedicalClinic; updatedLead: Lead }> {
  if (!lead.cnpj) {
    throw new Error('Para converter o lead em clínica médica, o CNPJ é obrigatório.');
  }

  // 1. Create the clinic
  const clinic = await createClinicInSupabase({
    cnpj: lead.cnpj,
    companyName: lead.companyName || lead.name,
    tradeName: lead.tradeName || lead.name,
    technicalResponsibleCrm: technicalResponsibleCrm || 'CRM/BR 00000',
    technicalResponsibleName: lead.contactName,
    specialties,
    phone: lead.phone,
    email: lead.email,
    city: lead.city,
    state: lead.state,
    status: 'ATIVO',
    contractStatus: 'EM_NEGOCIACAO',
    contractNotes: `Convertido do Lead "${lead.name}". ${lead.notes || ''}`,
  });

  // 2. Mark lead as CONVERTIDO and link clinic ID
  const { data: updatedLeadRow, error: leadErr } = await supabase
    .from('crm_leads')
    .update({
      status: 'CONVERTIDO',
      converted_clinic_id: clinic.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
    .select()
    .single();

  if (leadErr) {
    console.warn('Erro ao atualizar status do lead para CONVERTIDO:', leadErr.message);
  }

  return {
    clinic,
    updatedLead: updatedLeadRow ? mapDbToLead(updatedLeadRow) : { ...lead, status: 'CONVERTIDO', convertedClinicId: clinic.id },
  };
}
