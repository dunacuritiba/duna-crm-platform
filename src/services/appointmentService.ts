import { supabase } from './supabase';
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from '../types/appointment';

export function mapDbToAppointment(
  row: any,
  clinicName?: string,
  unitName?: string,
  doctorName?: string,
  doctorSpecialty?: string,
  attendantName?: string
): Appointment {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    clinicName: clinicName || row.clinic_name || undefined,
    unitId: row.unit_id || null,
    unitName: unitName || row.unit_name || undefined,
    doctorId: row.doctor_id || null,
    doctorName: doctorName || row.doctor_name || undefined,
    doctorSpecialty: doctorSpecialty || undefined,
    attendantId: row.attendant_id || null,
    attendantName: attendantName || row.attendant_name || undefined,
    patientName: row.patient_name,
    patientCpf: row.patient_cpf || undefined,
    patientPhone: row.patient_phone || undefined,
    patientEmail: row.patient_email || undefined,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    status: (row.status as AppointmentStatus) || 'AGENDADO',
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch appointments from Supabase with relational lookups
 */
export async function fetchAppointmentsFromSupabase(filters?: {
  attendantId?: string;
  clinicId?: string;
  date?: string;
}): Promise<Appointment[]> {
  try {
    let query = supabase
      .from('crm_appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (filters?.attendantId) {
      query = query.eq('attendant_id', filters.attendantId);
    }
    if (filters?.clinicId) {
      query = query.eq('clinic_id', filters.clinicId);
    }
    if (filters?.date) {
      query = query.eq('appointment_date', filters.date);
    }

    const { data: apptRows, error: apptErr } = await query;

    if (apptErr) {
      console.warn('Erro ao carregar agendamentos:', apptErr.message);
      return [];
    }

    if (!apptRows || apptRows.length === 0) {
      return [];
    }

    // Lookups
    const [clinicsRes, unitsRes, membersRes, usersRes] = await Promise.all([
      supabase.from('crm_clinics').select('id, company_name, trade_name'),
      supabase.from('crm_clinic_units').select('id, name'),
      supabase.from('crm_clinic_members').select('id, name, specialty'),
      supabase.from('crm_users').select('id, name'),
    ]);

    const clinicMap = new Map((clinicsRes.data || []).map((c) => [c.id, c.trade_name || c.company_name]));
    const unitMap = new Map((unitsRes.data || []).map((u) => [u.id, u.name]));
    const memberMap = new Map((membersRes.data || []).map((m) => [m.id, m]));
    const userMap = new Map((usersRes.data || []).map((u) => [u.id, u.name]));

    return apptRows.map((row) => {
      const clinicName = clinicMap.get(row.clinic_id);
      const unitName = row.unit_id ? unitMap.get(row.unit_id) : undefined;
      const member = row.doctor_id ? memberMap.get(row.doctor_id) : undefined;
      const attendantName = row.attendant_id ? userMap.get(row.attendant_id) : undefined;

      return mapDbToAppointment(
        row,
        clinicName,
        unitName,
        member?.name,
        member?.specialty,
        attendantName
      );
    });
  } catch (err) {
    console.error('Falha geral ao buscar agendamentos:', err);
    return [];
  }
}

/**
 * Create a new appointment
 */
export async function createAppointmentInSupabase(
  input: CreateAppointmentInput
): Promise<Appointment> {
  const insertPayload = {
    clinic_id: input.clinicId,
    unit_id: input.unitId || null,
    doctor_id: input.doctorId || null,
    attendant_id: input.attendantId || null,
    patient_name: input.patientName.trim(),
    patient_cpf: input.patientCpf?.trim() || null,
    patient_phone: input.patientPhone?.trim() || null,
    patient_email: input.patientEmail?.trim() || null,
    appointment_date: input.appointmentDate,
    appointment_time: input.appointmentTime,
    status: input.status || 'AGENDADO',
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('crm_appointments')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao salvar agendamento: ${error.message}`);
  }

  return mapDbToAppointment(data);
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatusInSupabase(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const { error } = await supabase
    .from('crm_appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao atualizar status do agendamento: ${error.message}`);
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointmentInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('crm_appointments').delete().eq('id', id);
  if (error) {
    throw new Error(`Erro ao excluir agendamento: ${error.message}`);
  }
}
