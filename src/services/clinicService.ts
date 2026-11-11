import { supabase } from './supabase';
import type {
  MedicalClinic,
  ClinicMember,
  ClinicUnit,
  CreateClinicInput,
  CreateClinicMemberInput,
  CreateClinicUnitInput,
} from '../types/clinic';

export function mapDbToUnit(row: any): ClinicUnit {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    phone: row.phone || undefined,
    email: row.email || undefined,
    zipCode: row.zip_code || undefined,
    street: row.street || undefined,
    number: row.number || undefined,
    complement: row.complement || undefined,
    neighborhood: row.neighborhood || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    isMain: Boolean(row.is_main),
    status: (row.status as ClinicUnit['status']) || 'ATIVO',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDbToClinic(
  row: any,
  members: ClinicMember[] = [],
  units: ClinicUnit[] = []
): MedicalClinic {
  const medicos = members.filter((m) => m.role === 'MEDICO').length;
  const secretarias = members.filter((m) => m.role === 'SECRETARIA').length;

  return {
    id: row.id,
    cnpj: row.cnpj,
    companyName: row.company_name,
    tradeName: row.trade_name || undefined,
    logo: row.logo || undefined,
    technicalResponsibleCrm: row.technical_responsible_crm,
    technicalResponsibleName: row.technical_responsible_name || undefined,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    phone: row.phone || undefined,
    email: row.email || undefined,
    zipCode: row.zip_code || undefined,
    street: row.street || undefined,
    number: row.number || undefined,
    complement: row.complement || undefined,
    neighborhood: row.neighborhood || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    status: (row.status as MedicalClinic['status']) || 'ATIVO',
    contractStatus: (row.contract_status as MedicalClinic['contractStatus']) || 'LEAD',
    contractStartDate: row.contract_start_date || undefined,
    contractEndDate: row.contract_end_date || undefined,
    contractNotes: row.contract_notes || undefined,
    units,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    membersCount: {
      total: members.length,
      medicos,
      secretarias,
    },
    members,
  };
}

export function mapDbToMember(row: any): ClinicMember {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    unitId: row.unit_id || null,
    unitNames: Array.isArray(row.unit_names) ? row.unit_names : [],
    userId: row.user_id || null,
    name: row.name,
    role: row.role as ClinicMember['role'],
    email: row.email,
    cpf: row.cpf || undefined,
    phone: row.phone || undefined,
    crm: row.crm || undefined,
    specialty: row.specialty || undefined,
    status: (row.status as ClinicMember['status']) || 'ATIVO',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all clinics along with their staff members and units
 */
export async function fetchClinicsFromSupabase(): Promise<MedicalClinic[]> {
  try {
    const { data: clinicsData, error: clinicsError } = await supabase
      .from('crm_clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicsError) {
      console.warn('Erro ao carregar clínicas do Supabase:', clinicsError.message);
      return [];
    }

    if (!clinicsData || clinicsData.length === 0) {
      return [];
    }

    // Fetch members
    const { data: membersData } = await supabase
      .from('crm_clinic_members')
      .select('*')
      .order('name', { ascending: true });

    const allMembers: ClinicMember[] = membersData ? membersData.map(mapDbToMember) : [];

    // Fetch units
    const { data: unitsData } = await supabase
      .from('crm_clinic_units')
      .select('*')
      .order('is_main', { ascending: false });

    const allUnits: ClinicUnit[] = unitsData ? unitsData.map(mapDbToUnit) : [];

    return clinicsData.map((row) => {
      const clinicMembers = allMembers.filter((m) => m.clinicId === row.id);
      const clinicUnits = allUnits.filter((u) => u.clinicId === row.id);
      return mapDbToClinic(row, clinicMembers, clinicUnits);
    });
  } catch (err: any) {
    console.error('Falha geral ao buscar clínicas:', err);
    return [];
  }
}

/**
 * Create a new clinic in Supabase and optionally initial units
 */
export async function createClinicInSupabase(input: CreateClinicInput): Promise<MedicalClinic> {
  const insertPayload = {
    cnpj: input.cnpj.trim(),
    company_name: input.companyName.trim(),
    trade_name: input.tradeName?.trim() || null,
    logo: input.logo || null,
    technical_responsible_crm: input.technicalResponsibleCrm.trim(),
    technical_responsible_name: input.technicalResponsibleName?.trim() || null,
    specialties: input.specialties || [],
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    zip_code: input.zipCode?.trim() || null,
    street: input.street?.trim() || null,
    number: input.number?.trim() || null,
    complement: input.complement?.trim() || null,
    neighborhood: input.neighborhood?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    status: input.status || 'ATIVO',
    contract_status: input.contractStatus || 'LEAD',
    contract_start_date: input.contractStartDate || null,
    contract_end_date: input.contractEndDate || null,
    contract_notes: input.contractNotes?.trim() || null,
  };

  const { data: clinicRow, error: clinicErr } = await supabase
    .from('crm_clinics')
    .insert([insertPayload])
    .select()
    .single();

  if (clinicErr) {
    if (clinicErr.code === '23505') {
      throw new Error('Já existe uma clínica cadastrada com este CNPJ.');
    }
    throw new Error(`Erro ao cadastrar clínica: ${clinicErr.message}`);
  }

  // Create units if provided (or default Matriz)
  const unitsToInsert = (input.units && input.units.length > 0)
    ? input.units
    : [
        {
          name: 'Unidade Principal (Matriz)',
          isMain: true,
          phone: input.phone,
          email: input.email,
          zipCode: input.zipCode,
          street: input.street,
          number: input.number,
          complement: input.complement,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          status: 'ATIVO' as const,
        },
      ];

  const insertedUnits: ClinicUnit[] = [];
  for (const u of unitsToInsert) {
    const { data: unitData } = await supabase
      .from('crm_clinic_units')
      .insert([
        {
          clinic_id: clinicRow.id,
          name: u.name.trim(),
          phone: u.phone?.trim() || null,
          email: u.email?.trim() || null,
          zip_code: u.zipCode?.trim() || null,
          street: u.street?.trim() || null,
          number: u.number?.trim() || null,
          complement: u.complement?.trim() || null,
          neighborhood: u.neighborhood?.trim() || null,
          city: u.city?.trim() || null,
          state: u.state?.trim() || null,
          is_main: Boolean(u.isMain),
          status: u.status || 'ATIVO',
        },
      ])
      .select()
      .single();

    if (unitData) {
      insertedUnits.push(mapDbToUnit(unitData));
    }
  }

  return mapDbToClinic(clinicRow, [], insertedUnits);
}

/**
 * Update an existing clinic and units
 */
export async function updateClinicInSupabase(
  id: string,
  updates: Partial<CreateClinicInput>
): Promise<MedicalClinic> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.cnpj !== undefined) updatePayload.cnpj = updates.cnpj.trim();
  if (updates.companyName !== undefined) updatePayload.company_name = updates.companyName.trim();
  if (updates.tradeName !== undefined) updatePayload.trade_name = updates.tradeName.trim() || null;
  if (updates.logo !== undefined) updatePayload.logo = updates.logo || null;
  if (updates.technicalResponsibleCrm !== undefined)
    updatePayload.technical_responsible_crm = updates.technicalResponsibleCrm.trim();
  if (updates.technicalResponsibleName !== undefined)
    updatePayload.technical_responsible_name = updates.technicalResponsibleName.trim() || null;
  if (updates.specialties !== undefined) updatePayload.specialties = updates.specialties;
  if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim() || null;
  if (updates.email !== undefined) updatePayload.email = updates.email.trim() || null;
  if (updates.zipCode !== undefined) updatePayload.zip_code = updates.zipCode.trim() || null;
  if (updates.street !== undefined) updatePayload.street = updates.street.trim() || null;
  if (updates.number !== undefined) updatePayload.number = updates.number.trim() || null;
  if (updates.complement !== undefined) updatePayload.complement = updates.complement.trim() || null;
  if (updates.neighborhood !== undefined) updatePayload.neighborhood = updates.neighborhood.trim() || null;
  if (updates.city !== undefined) updatePayload.city = updates.city.trim() || null;
  if (updates.state !== undefined) updatePayload.state = updates.state.trim() || null;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.contractStatus !== undefined) updatePayload.contract_status = updates.contractStatus;
  if (updates.contractStartDate !== undefined) updatePayload.contract_start_date = updates.contractStartDate || null;
  if (updates.contractEndDate !== undefined) updatePayload.contract_end_date = updates.contractEndDate || null;
  if (updates.contractNotes !== undefined) updatePayload.contract_notes = updates.contractNotes.trim() || null;

  const { data: clinicData, error: clinicErr } = await supabase
    .from('crm_clinics')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (clinicErr) {
    throw new Error(`Erro ao atualizar clínica: ${clinicErr.message}`);
  }

  // Handle units if passed in updates
  if (updates.units) {
    // Delete existing units and re-insert or sync
    await supabase.from('crm_clinic_units').delete().eq('clinic_id', id);
    for (const u of updates.units) {
      await supabase.from('crm_clinic_units').insert([
        {
          clinic_id: id,
          name: u.name.trim(),
          phone: u.phone?.trim() || null,
          email: u.email?.trim() || null,
          zip_code: u.zipCode?.trim() || null,
          street: u.street?.trim() || null,
          number: u.number?.trim() || null,
          complement: u.complement?.trim() || null,
          neighborhood: u.neighborhood?.trim() || null,
          city: u.city?.trim() || null,
          state: u.state?.trim() || null,
          is_main: Boolean(u.isMain),
          status: u.status || 'ATIVO',
        },
      ]);
    }
  }

  const members = await fetchClinicMembers(id);
  const units = await fetchClinicUnits(id);
  return mapDbToClinic(clinicData, members, units);
}

/**
 * Toggle clinic active/inactive status
 */
export async function toggleClinicStatusInSupabase(
  id: string,
  currentStatus: 'ATIVO' | 'INATIVO'
): Promise<MedicalClinic> {
  const nextStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
  return updateClinicInSupabase(id, { status: nextStatus });
}

/**
 * Fetch units of a specific clinic
 */
export async function fetchClinicUnits(clinicId: string): Promise<ClinicUnit[]> {
  const { data, error } = await supabase
    .from('crm_clinic_units')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('is_main', { ascending: false });

  if (error) {
    console.warn(`Erro ao carregar unidades da clínica ${clinicId}:`, error.message);
    return [];
  }

  return (data || []).map(mapDbToUnit);
}

/**
 * Add a new unit to a clinic
 */
export async function createClinicUnitInSupabase(
  clinicId: string,
  unit: CreateClinicUnitInput
): Promise<ClinicUnit> {
  const { data, error } = await supabase
    .from('crm_clinic_units')
    .insert([
      {
        clinic_id: clinicId,
        name: unit.name.trim(),
        phone: unit.phone?.trim() || null,
        email: unit.email?.trim() || null,
        zip_code: unit.zipCode?.trim() || null,
        street: unit.street?.trim() || null,
        number: unit.number?.trim() || null,
        complement: unit.complement?.trim() || null,
        neighborhood: unit.neighborhood?.trim() || null,
        city: unit.city?.trim() || null,
        state: unit.state?.trim() || null,
        is_main: Boolean(unit.isMain),
        status: unit.status || 'ATIVO',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar unidade da clínica: ${error.message}`);
  }

  return mapDbToUnit(data);
}

/**
 * Delete a unit from a clinic
 */
export async function deleteClinicUnitInSupabase(unitId: string): Promise<void> {
  const { error } = await supabase.from('crm_clinic_units').delete().eq('id', unitId);
  if (error) {
    throw new Error(`Erro ao remover unidade: ${error.message}`);
  }
}

/**
 * Fetch members of a specific clinic
 */
export async function fetchClinicMembers(clinicId: string): Promise<ClinicMember[]> {
  const { data, error } = await supabase
    .from('crm_clinic_members')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true });

  if (error) {
    console.warn(`Erro ao carregar colaboradores da clínica ${clinicId}:`, error.message);
    return [];
  }

  return (data || []).map(mapDbToMember);
}

/**
 * Add a member (Médico or Secretária) to a clinic
 */
export async function createClinicMemberInSupabase(
  input: CreateClinicMemberInput
): Promise<ClinicMember> {
  const insertPayload = {
    clinic_id: input.clinicId,
    unit_id: input.unitId || null,
    unit_names: input.unitNames || [],
    name: input.name.trim(),
    role: input.role,
    email: input.email.trim().toLowerCase(),
    cpf: input.cpf?.trim() || null,
    phone: input.phone?.trim() || null,
    crm: input.role === 'MEDICO' ? (input.crm?.trim() || null) : null,
    specialty: input.role === 'MEDICO' ? (input.specialty?.trim() || null) : null,
    status: input.status || 'ATIVO',
  };

  const { data, error } = await supabase
    .from('crm_clinic_members')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar profissional na clínica: ${error.message}`);
  }

  return mapDbToMember(data);
}

/**
 * Update a member of a clinic
 */
export async function updateClinicMemberInSupabase(
  id: string,
  updates: Partial<CreateClinicMemberInput>
): Promise<ClinicMember> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updatePayload.name = updates.name.trim();
  if (updates.unitId !== undefined) updatePayload.unit_id = updates.unitId || null;
  if (updates.unitNames !== undefined) updatePayload.unit_names = updates.unitNames || [];
  if (updates.role !== undefined) updatePayload.role = updates.role;
  if (updates.email !== undefined) updatePayload.email = updates.email.trim().toLowerCase();
  if (updates.cpf !== undefined) updatePayload.cpf = updates.cpf.trim() || null;
  if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim() || null;
  if (updates.crm !== undefined) updatePayload.crm = updates.crm.trim() || null;
  if (updates.specialty !== undefined) updatePayload.specialty = updates.specialty.trim() || null;
  if (updates.status !== undefined) updatePayload.status = updates.status;

  const { data, error } = await supabase
    .from('crm_clinic_members')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar colaborador da clínica: ${error.message}`);
  }

  return mapDbToMember(data);
}

/**
 * Remove a member from a clinic
 */
export async function deleteClinicMemberInSupabase(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_clinic_members')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao excluir colaborador da clínica: ${error.message}`);
  }
}

/**
 * Toggle member active/inactive status
 */
export async function toggleClinicMemberStatusInSupabase(
  id: string,
  currentStatus: 'ATIVO' | 'INATIVO'
): Promise<ClinicMember> {
  const nextStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
  return updateClinicMemberInSupabase(id, { status: nextStatus });
}
