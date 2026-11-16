import type { LeadStatus, LeadTemperature, LeadSource, LeadType } from '../types/lead';

export function getLeadStatusLabel(status: LeadStatus): string {
  switch (status) {
    case 'NOVO':
      return 'Novo Lead';
    case 'CONTATO_REALIZADO':
      return 'Contato Realizado';
    case 'QUALIFICADO':
      return 'Qualificado';
    case 'PROPOSTA_ENVIADA':
      return 'Proposta Enviada';
    case 'NEGOCIACAO':
      return 'Em Negociação';
    case 'CONVERTIDO':
      return 'Convertido / Ganho';
    case 'PERDIDO':
      return 'Perdido / Desqualificado';
    default:
      return status;
  }
}

export function getLeadStatusBadgeClass(status: LeadStatus): string {
  switch (status) {
    case 'NOVO':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'CONTATO_REALIZADO':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'QUALIFICADO':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'PROPOSTA_ENVIADA':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'NEGOCIACAO':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CONVERTIDO':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
    case 'PERDIDO':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getLeadTemperatureLabel(temp: LeadTemperature): string {
  switch (temp) {
    case 'FRIO':
      return 'Frio';
    case 'MORNO':
      return 'Morno';
    case 'QUENTE':
      return 'Quente';
    default:
      return temp;
  }
}

export function getLeadTemperatureBadgeClass(temp: LeadTemperature): string {
  switch (temp) {
    case 'FRIO':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'MORNO':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'QUENTE':
      return 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export function getLeadSourceLabel(source: LeadSource): string {
  switch (source) {
    case 'INDICACAO':
      return 'Indicação';
    case 'GOOGLE':
      return 'Google / Tráfego Pago';
    case 'REDES_SOCIAIS':
      return 'Redes Sociais';
    case 'EVENTO':
      return 'Congresso / Evento';
    case 'OUTBOUND':
      return 'Prospecção Ativa';
    case 'SITE':
      return 'Site Oficial';
    case 'WHATSAPP':
      return 'WhatsApp Direto';
    case 'OUTRO':
      return 'Outro Canal';
    default:
      return source;
  }
}

export function getLeadTypeLabel(type: LeadType): string {
  switch (type) {
    case 'CLINICA':
      return 'Clínica Médica';
    case 'CONSULTORIO':
      return 'Consultório';
    case 'HOSPITAL':
      return 'Hospital / Day Clinic';
    case 'LABORATORIO':
      return 'Laboratório / Imagem';
    case 'OUTRO':
      return 'Outro Estabelecimento';
    default:
      return type;
  }
}
