export type LeadStatus =
  | 'NOVO'
  | 'CONTATO_REALIZADO'
  | 'QUALIFICADO'
  | 'PROPOSTA_ENVIADA'
  | 'NEGOCIACAO'
  | 'CONVERTIDO'
  | 'PERDIDO';

export type LeadTemperature = 'FRIO' | 'MORNO' | 'QUENTE';

export type LeadSource =
  | 'INDICACAO'
  | 'GOOGLE'
  | 'REDES_SOCIAIS'
  | 'EVENTO'
  | 'OUTBOUND'
  | 'SITE'
  | 'WHATSAPP'
  | 'OUTRO';

export type LeadType = 'CLINICA' | 'CONSULTORIO' | 'HOSPITAL' | 'LABORATORIO' | 'OUTRO';

export interface Lead {
  id: string;
  name: string; // Nome da instituição / lead
  companyName?: string;
  tradeName?: string;
  contactName?: string; // Decisor (ex: Dr. Carlos)
  contactRole?: string; // Ex: Diretor Clínico, Sócio
  email?: string;
  phone?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  leadType: LeadType;
  status: LeadStatus;
  temperature: LeadTemperature;
  source: LeadSource;
  estimatedValue?: number; // R$ valor mensal ou do contrato
  lossReason?: string;
  nextFollowUp?: string; // YYYY-MM-DD
  notes?: string;
  convertedClinicId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  companyName?: string;
  tradeName?: string;
  contactName?: string;
  contactRole?: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  leadType?: LeadType;
  status?: LeadStatus;
  temperature?: LeadTemperature;
  source?: LeadSource;
  estimatedValue?: number;
  lossReason?: string;
  nextFollowUp?: string;
  notes?: string;
}
