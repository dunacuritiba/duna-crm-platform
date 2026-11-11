/**
 * Cleans non-numeric characters from string
 */
export function cleanCPF(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Applies mask: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const digits = cleanCPF(value).slice(0, 11);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validates Brazilian CPF checksum
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);

  if (cleaned.length !== 11) {
    return false;
  }

  // Check for common invalid sequences (all same numbers like 11111111111)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validate 1st verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleaned.charAt(9), 10)) {
    return false;
  }

  // Validate 2nd verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleaned.charAt(10), 10)) {
    return false;
  }

  return true;
}
