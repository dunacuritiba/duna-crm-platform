export type ClinicStatus = 'ATIVO' | 'INATIVO';

export type ClinicContractStatus =
  | 'LEAD'
  | 'EM_NEGOCIACAO'
  | 'CONTRATO_NEGADO'
  | 'CONTRATO_VIGENTE'
  | 'CONTRATO_A_VENCER'
  | 'CONTRATO_VENCIDO';

export type MemberRole = 'MEDICO' | 'SECRETARIA';
export type MemberStatus = 'ATIVO' | 'INATIVO';

export interface ClinicUnit {
  id: string;
  clinicId: string;
  name: string; // Ex: "Matriz - Centro", "Unidade Jardins"
  phone?: string;
  email?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  isMain?: boolean;
  status: ClinicStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClinicUnitInput {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  isMain?: boolean;
  status?: ClinicStatus;
}

export interface ClinicMember {
  id: string;
  clinicId: string;
  unitId?: string | null;
  unitNames?: string[]; // Unidades onde o médico atende
  userId?: string | null;
  name: string;
  role: MemberRole;
  email: string;
  cpf?: string;
  phone?: string;
  crm?: string; // Obrigatório ou prioritário quando role === 'MEDICO'
  specialty?: string; // Ex: Cardiologista, Ortopedista, etc.
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalClinic {
  id: string;
  cnpj: string;
  companyName: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  logo?: string; // Logo da clínica (URL / Base64)
  technicalResponsibleCrm: string; // CRM do Responsável Técnico
  technicalResponsibleName?: string; // Nome do Médico Responsável
  specialties: string[]; // Áreas de Atuação / Especialidades
  phone?: string;
  email?: string;
  zipCode?: string; // CEP
  street?: string; // Logradouro
  number?: string;
  complement?: string;
  neighborhood?: string; // Bairro
  city?: string;
  state?: string; // UF
  status: ClinicStatus;
  contractStatus: ClinicContractStatus;
  contractStartDate?: string;
  contractEndDate?: string;
  contractNotes?: string;
  units?: ClinicUnit[];
  createdAt: string;
  updatedAt: string;
  membersCount?: {
    total: number;
    medicos: number;
    secretarias: number;
  };
  members?: ClinicMember[];
}

export interface CreateClinicInput {
  cnpj: string;
  companyName: string;
  tradeName?: string;
  logo?: string;
  technicalResponsibleCrm: string;
  technicalResponsibleName?: string;
  specialties: string[];
  phone?: string;
  email?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  status?: ClinicStatus;
  contractStatus?: ClinicContractStatus;
  contractStartDate?: string;
  contractEndDate?: string;
  contractNotes?: string;
  units?: CreateClinicUnitInput[];
}

export interface CreateClinicMemberInput {
  clinicId: string;
  unitId?: string | null;
  unitNames?: string[];
  name: string;
  role: MemberRole;
  email: string;
  cpf?: string;
  phone?: string;
  crm?: string;
  specialty?: string;
  status?: MemberStatus;
}
