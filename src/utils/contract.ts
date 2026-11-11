import type { ClinicContractStatus } from '../types/clinic';

export interface ContractStatusDetails {
  status: ClinicContractStatus;
  label: string;
  badgeClass: string;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export function getContractStatusLabel(status: ClinicContractStatus): string {
  switch (status) {
    case 'LEAD':
      return 'Lead';
    case 'EM_NEGOCIACAO':
      return 'Em Negociação';
    case 'CONTRATO_NEGADO':
      return 'Contrato Negado';
    case 'CONTRATO_VIGENTE':
      return 'Contrato Vigente';
    case 'CONTRATO_A_VENCER':
      return 'Contrato a Vencer';
    case 'CONTRATO_VENCIDO':
      return 'Contrato Vencido';
    default:
      return status;
  }
}

export function getContractStatusBadgeClass(status: ClinicContractStatus): string {
  switch (status) {
    case 'LEAD':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'EM_NEGOCIACAO':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CONTRATO_NEGADO':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'CONTRATO_VIGENTE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CONTRATO_A_VENCER':
      return 'bg-orange-50 text-orange-700 border-orange-300 animate-pulse';
    case 'CONTRATO_VENCIDO':
      return 'bg-rose-50 text-rose-700 border-rose-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

/**
 * Computes live contract status based on explicit stage and end date
 */
export function getLiveContractStatus(
  explicitStatus: ClinicContractStatus = 'LEAD',
  endDate?: string
): ContractStatusDetails {
  // If no end date or initial lead/negotiation stages
  if (!endDate) {
    return {
      status: explicitStatus,
      label: getContractStatusLabel(explicitStatus),
      badgeClass: getContractStatusBadgeClass(explicitStatus),
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  // Calculate days remaining until contractEndDate
  const [year, month, day] = endDate.split('-').map(Number);
  const end = new Date(year, month - 1, day, 23, 59, 59);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If in negotiation or denied, keep unless user selected a contract active state
  if (explicitStatus === 'LEAD' || explicitStatus === 'EM_NEGOCIACAO' || explicitStatus === 'CONTRATO_NEGADO') {
    return {
      status: explicitStatus,
      label: getContractStatusLabel(explicitStatus),
      badgeClass: getContractStatusBadgeClass(explicitStatus),
      daysRemaining,
      isExpiringSoon: false,
      isExpired: daysRemaining < 0,
    };
  }

  if (daysRemaining < 0) {
    return {
      status: 'CONTRATO_VENCIDO',
      label: 'Contrato Vencido',
      badgeClass: getContractStatusBadgeClass('CONTRATO_VENCIDO'),
      daysRemaining,
      isExpiringSoon: false,
      isExpired: true,
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'CONTRATO_A_VENCER',
      label: `A Vencer (${daysRemaining}d)`,
      badgeClass: getContractStatusBadgeClass('CONTRATO_A_VENCER'),
      daysRemaining,
      isExpiringSoon: true,
      isExpired: false,
    };
  }

  return {
    status: 'CONTRATO_VIGENTE',
    label: 'Contrato Vigente',
    badgeClass: getContractStatusBadgeClass('CONTRATO_VIGENTE'),
    daysRemaining,
    isExpiringSoon: false,
    isExpired: false,
  };
}
