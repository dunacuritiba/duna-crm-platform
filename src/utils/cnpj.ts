/**
 * CNPJ & CEP utilities and API integrations
 */

export interface CNPJLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  cnaeDescricao?: string;
}

export interface CEPLookupResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export function cleanNumeric(val: string): string {
  return (val || '').replace(/\D/g, '');
}

export function formatCNPJ(val: string): string {
  const digits = cleanNumeric(val).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function formatCEP(val: string): string {
  const digits = cleanNumeric(val).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function formatPhone(val: string): string {
  const digits = cleanNumeric(val).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cleanNumeric(cnpj);
  if (clean.length !== 14) return false;
  // Reject identical digits (00000000000000, 11111111111111, etc.)
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
}

/**
 * Consulta dados do CNPJ via BrasilAPI com timeout e fallback para MinhaReceita
 */
export async function fetchCNPJ(cnpjRaw: string): Promise<CNPJLookupResult> {
  const clean = cleanNumeric(cnpjRaw);
  if (clean.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos numéricos.');
  }

  // 1st attempt: BrasilAPI
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        cnpj: formatCNPJ(clean),
        razaoSocial: data.razao_social || data.nome || '',
        nomeFantasia: data.nome_fantasia || '',
        cep: data.cep ? formatCEP(String(data.cep)) : '',
        logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ') || data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        uf: data.uf || '',
        telefone: data.ddd_telefone_1 ? formatPhone(String(data.ddd_telefone_1)) : '',
        email: data.email || '',
        cnaeDescricao: data.cnae_fiscal_descricao || '',
      };
    }
  } catch (err: any) {
    console.warn('BrasilAPI CNPJ error, tentando fallback...', err?.message);
  }

  // 2nd attempt fallback: Minha Receita
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`https://minhareceita.org/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        cnpj: formatCNPJ(clean),
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || '',
        cep: data.cep ? formatCEP(String(data.cep)) : '',
        logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ') || data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        uf: data.uf || '',
        telefone: data.ddd_telefone_1 ? formatPhone(String(data.ddd_telefone_1)) : '',
        email: data.email || '',
        cnaeDescricao: data.cnae_fiscal_descricao || '',
      };
    }
  } catch (err: any) {
    console.warn('MinhaReceita fallback failed:', err?.message);
  }

  throw new Error('Não foi possível consultar os dados do CNPJ automaticamente. Preencha os campos manualmente.');
}

/**
 * Consulta CEP via ViaCEP com fallback BrasilAPI
 */
export async function fetchCEP(cepRaw: string): Promise<CEPLookupResult> {
  const clean = cleanNumeric(cepRaw);
  if (clean.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos.');
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          cep: formatCEP(clean),
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
        };
      }
    }
  } catch (err) {
    console.warn('ViaCEP failed, trying BrasilAPI...', err);
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${clean}`);
    if (res.ok) {
      const data = await res.json();
      return {
        cep: formatCEP(clean),
        logradouro: data.street || '',
        bairro: data.neighborhood || '',
        cidade: data.city || '',
        uf: data.state || '',
      };
    }
  } catch (err) {
    console.warn('BrasilAPI CEP failed:', err);
  }

  throw new Error('CEP não localizado.');
}
