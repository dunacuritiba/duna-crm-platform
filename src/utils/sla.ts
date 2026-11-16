export type SlaStatus = 'ON_TIME' | 'AT_RISK' | 'EXPIRED';

export interface SlaInfo {
  status: SlaStatus;
  label: string;
  remainingText: string;
  isExpired: boolean;
  percentageRemaining: number;
}

/**
 * Calculates current SLA status and remaining time for a ticket
 */
export function calculateSlaInfo(slaDeadline: string, createdAt: string): SlaInfo {
  const now = Date.now();
  const deadlineMs = new Date(slaDeadline).getTime();
  const createdMs = new Date(createdAt).getTime();

  const totalDuration = Math.max(deadlineMs - createdMs, 1);
  const remainingMs = deadlineMs - now;

  if (remainingMs <= 0) {
    const expiredHours = Math.abs(Math.floor(remainingMs / (1000 * 60 * 60)));
    const expiredMins = Math.abs(Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

    return {
      status: 'EXPIRED',
      label: 'SLA Estourado',
      remainingText: `Vencido há ${expiredHours > 0 ? `${expiredHours}h ` : ''}${expiredMins}m`,
      isExpired: true,
      percentageRemaining: 0,
    };
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  const percentage = Math.min(100, Math.max(0, Math.round((remainingMs / totalDuration) * 100)));

  // If less than 20% of time remaining or less than 2 hours
  const isAtRisk = percentage <= 20 || remainingMs <= 2 * 60 * 60 * 1000;

  return {
    status: isAtRisk ? 'AT_RISK' : 'ON_TIME',
    label: isAtRisk ? 'SLA em Risco' : 'No Prazo',
    remainingText: `${hours > 0 ? `${hours}h ` : ''}${minutes}m restantes`,
    isExpired: false,
    percentageRemaining: percentage,
  };
}
