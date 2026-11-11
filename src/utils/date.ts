/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateString;
}

/**
 * Calculates age based on YYYY-MM-DD
 */
export function calculateAge(birthDateString: string): number | null {
  if (!birthDateString) return null;
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Validates birth date (must be in past and realistic, e.g. < 120 years)
 */
export function isValidBirthDate(dateString: string): { valid: boolean; message?: string } {
  if (!dateString) {
    return { valid: false, message: 'Data de nascimento é obrigatória' };
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Data de nascimento inválida' };
  }
  const today = new Date();
  if (date > today) {
    return { valid: false, message: 'Data de nascimento não pode estar no futuro' };
  }
  const age = calculateAge(dateString);
  if (age !== null && age > 120) {
    return { valid: false, message: 'Idade inválida (superior a 120 anos)' };
  }
  return { valid: true };
}
