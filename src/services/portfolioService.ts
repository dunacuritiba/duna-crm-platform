import { supabase } from './supabase';
import type { MedicalClinic } from '../types/clinic';
import { fetchClinicsFromSupabase } from './clinicService';
import { isClinicContractActive } from '../utils/contract';

export interface AttendantPortfolioSummary {
  attendantId: string;
  clinicCount: number;
  clinicIds: string[];
}

/**
 * Fetch a mapping of attendant ID to list of clinic IDs in their portfolio
 */
export async function fetchAllPortfolioAssignments(): Promise<Record<string, string[]>> {
  try {
    const { data, error } = await supabase
      .from('crm_attendant_clinics')
      .select('attendant_id, clinic_id');

    if (error) {
      console.warn('Erro ao carregar carteiras de atendentes:', error.message);
      return {};
    }

    const map: Record<string, string[]> = {};
    if (data) {
      data.forEach((row) => {
        if (!map[row.attendant_id]) {
          map[row.attendant_id] = [];
        }
        map[row.attendant_id].push(row.clinic_id);
      });
    }
    return map;
  } catch (err) {
    console.error('Falha ao buscar associações de carteira:', err);
    return {};
  }
}

/**
 * Assign / Synchronize clinics for a specific attendant
 * - Replaces current portfolio for this attendant with `newClinicIds`
 * - Also updates `assigned_attendant_id` on `crm_clinics`
 */
export async function saveAttendantPortfolio(
  attendantId: string,
  newClinicIds: string[],
  assignedByUserId?: string
): Promise<void> {
  // 1. Fetch current clinics assigned to this attendant in junction table
  const { data: currentRows, error: fetchErr } = await supabase
    .from('crm_attendant_clinics')
    .select('clinic_id')
    .eq('attendant_id', attendantId);

  if (fetchErr) {
    console.error('Erro ao ler carteira atual:', fetchErr.message);
  }

  const currentIds = (currentRows || []).map((r) => r.clinic_id);
  const toRemove = currentIds.filter((id) => !newClinicIds.includes(id));
  const toAdd = newClinicIds.filter((id) => !currentIds.includes(id));

  // 2. Remove detached clinics from junction table
  if (toRemove.length > 0) {
    await supabase
      .from('crm_attendant_clinics')
      .delete()
      .eq('attendant_id', attendantId)
      .in('clinic_id', toRemove);

    // Also clear assigned_attendant_id on crm_clinics if it currently points to this attendant
    await supabase
      .from('crm_clinics')
      .update({ assigned_attendant_id: null })
      .in('id', toRemove)
      .eq('assigned_attendant_id', attendantId);
  }

  // 3. Insert newly assigned clinics to junction table
  if (toAdd.length > 0) {
    // Validate: only clinics with active/valid contracts can be assigned to portfolio
    const allClinics = await fetchClinicsFromSupabase();
    const invalidClinic = toAdd.find((id) => {
      const c = allClinics.find((item) => item.id === id);
      return !c || !isClinicContractActive(c.status, c.contractStatus, c.contractEndDate);
    });

    if (invalidClinic) {
      throw new Error(
        'Apenas clínicas com contrato vigente podem ser distribuídas para a carteira de atendentes.'
      );
    }

    const inserts = toAdd.map((clinicId) => ({
      attendant_id: attendantId,
      clinic_id: clinicId,
      assigned_by: assignedByUserId || null,
      assigned_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await supabase
      .from('crm_attendant_clinics')
      .upsert(inserts, { onConflict: 'attendant_id,clinic_id' });

    if (insertErr) {
      console.error('Erro ao inserir novas clínicas na carteira:', insertErr.message);
    }

    // Update crm_clinics primary assigned_attendant_id
    await supabase
      .from('crm_clinics')
      .update({ assigned_attendant_id: attendantId })
      .in('id', toAdd);
  }
}

/**
 * Fetch clinics assigned to a specific attendant (only active contracts)
 */
export async function fetchClinicsForAttendant(attendantId: string): Promise<MedicalClinic[]> {
  const allClinics = await fetchClinicsFromSupabase();
  const assignments = await fetchAllPortfolioAssignments();
  const assignedIds = assignments[attendantId] || [];

  return allClinics.filter(
    (c) =>
      isClinicContractActive(c.status, c.contractStatus, c.contractEndDate) &&
      (assignedIds.includes(c.id) || c.assignedAttendantId === attendantId)
  );
}
