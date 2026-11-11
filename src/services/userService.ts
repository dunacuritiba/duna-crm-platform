import { supabase } from './supabase';
import type { User, CreateUserInput, SignUpInput, UpdateUserProfileInput } from '../types/user';
import { INITIAL_USERS } from './mockData';
import { sendOtpEmail } from './emailService';

const CURRENT_USER_KEY = 'crm_platform_current_user_id_v1';

// Convert DB snake_case row to TypeScript camelCase User
export function mapDbToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    email: row.email,
    birthDate: row.birth_date,
    avatar: row.avatar,
    role: row.role as User['role'],
    status: row.status as User['status'],
    phone: row.phone || undefined,
    department: row.department || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    password: row.password || undefined,
    otpCode: row.otp_code || null,
    otpExpiresAt: row.otp_expires_at || null,
    otpType: row.otp_type || null,
    isVerified: row.is_verified ?? true,
  };
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Fetch all users from Supabase duna-flow
 */
export async function fetchUsersFromSupabase(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('crm_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to mock data:', error.message);
      return INITIAL_USERS;
    }

    if (!data || data.length === 0) {
      return INITIAL_USERS;
    }

    return data.map(mapDbToUser);
  } catch (err) {
    console.error('Error fetching users from Supabase:', err);
    return INITIAL_USERS;
  }
}

/**
 * Self-registration:
 * Automatically assigns role 'USUARIO', status 'PENDENTE',
 * generates 6-digit OTP, saves in Supabase, and dispatches email.
 * Note: OTP is NOT returned to frontend to prevent on-screen exposure.
 */
export async function signUpUser(input: SignUpInput): Promise<{ user: User }> {
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  const userAvatar = input.avatar.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name.trim())}&background=6366f1&color=ffffff&bold=true`;

  const insertPayload = {
    name: input.name.trim(),
    cpf: input.cpf.trim(),
    email: input.email.trim().toLowerCase(),
    birth_date: input.birthDate,
    avatar: userAvatar,
    password: input.password,
    role: 'USUARIO', // Automatically assigned per requirements!
    status: 'PENDENTE', // Inactive until OTP is confirmed!
    is_verified: false,
    otp_code: otpCode,
    otp_type: 'REGISTRATION',
    otp_expires_at: expiresAt,
    phone: input.phone?.trim() || null,
    department: input.department?.trim() || 'Comercial',
  };

  const { data, error } = await supabase
    .from('crm_users')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Send email to user's real email address
  await sendOtpEmail({
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    otpCode,
    type: 'REGISTRATION',
  });

  return { user: mapDbToUser(data) };
}

/**
 * Confirms Registration OTP and activates the account automatically!
 */
export async function verifyRegistrationOtp(email: string, code: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: userRow, error: fetchErr } = await supabase
    .from('crm_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (fetchErr || !userRow) {
    throw new Error('Usuário não encontrado.');
  }

  if (userRow.otp_type !== 'REGISTRATION' || userRow.otp_code !== code.trim()) {
    throw new Error('Código OTP incorreto. Acesse seu e-mail e verifique o código de 6 dígitos.');
  }

  if (userRow.otp_expires_at && new Date(userRow.otp_expires_at) < new Date()) {
    throw new Error('O código OTP expirou. Solicite um novo reenvio.');
  }

  // Activate user automatically!
  const { data: updatedData, error: updateErr } = await supabase
    .from('crm_users')
    .update({
      status: 'ATIVO',
      is_verified: true,
      otp_code: null,
      otp_type: null,
      otp_expires_at: null,
    })
    .eq('id', userRow.id)
    .select()
    .single();

  if (updateErr) {
    throw new Error('Erro ao ativar a conta: ' + updateErr.message);
  }

  const activatedUser = mapDbToUser(updatedData);
  setCurrentUserId(activatedUser.id);
  return activatedUser;
}

/**
 * Resend OTP for either registration or password reset
 */
export async function resendOtp(email: string, type: 'REGISTRATION' | 'PASSWORD_RESET'): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { data: userRow, error } = await supabase
    .from('crm_users')
    .update({
      otp_code: otpCode,
      otp_type: type,
      otp_expires_at: expiresAt,
    })
    .eq('email', normalizedEmail)
    .select('name')
    .single();

  if (error) {
    throw new Error('Falha ao reenviar código: ' + error.message);
  }

  // Dispatch email with new OTP
  await sendOtpEmail({
    email: normalizedEmail,
    name: userRow?.name || 'Usuário',
    otpCode,
    type,
  });
}

/**
 * Request Password Reset:
 * Generates OTP, flags otp_type = 'PASSWORD_RESET', and sends email.
 * The user's login is locked until they finish changing their password!
 */
export async function requestPasswordReset(email: string): Promise<{ email: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: userRow, error: fetchErr } = await supabase
    .from('crm_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (fetchErr || !userRow) {
    throw new Error('Não encontramos nenhuma conta com o e-mail informado.');
  }

  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Flag recovery: this locks standard login until the reset flow completes!
  const { error: updateErr } = await supabase
    .from('crm_users')
    .update({
      otp_code: otpCode,
      otp_type: 'PASSWORD_RESET',
      otp_expires_at: expiresAt,
    })
    .eq('id', userRow.id);

  if (updateErr) {
    throw new Error('Erro ao gerar código de recuperação: ' + updateErr.message);
  }

  // Dispatch email
  await sendOtpEmail({
    email: normalizedEmail,
    name: userRow.name,
    otpCode,
    type: 'PASSWORD_RESET',
  });

  return { email: normalizedEmail };
}

/**
 * Verify Password Reset OTP
 */
export async function verifyResetOtp(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: userRow, error: fetchErr } = await supabase
    .from('crm_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (fetchErr || !userRow) {
    throw new Error('Usuário não encontrado.');
  }

  if (userRow.otp_type !== 'PASSWORD_RESET' || userRow.otp_code !== code.trim()) {
    throw new Error('Código de recuperação incorreto. Acesse seu e-mail e verifique o código.');
  }

  if (userRow.otp_expires_at && new Date(userRow.otp_expires_at) < new Date()) {
    throw new Error('O código de recuperação expirou. Solicite um novo reenvio.');
  }

  return true;
}

/**
 * Complete Password Reset:
 * Updates password and clears the recovery lock, restoring login!
 */
export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: userRow, error: fetchErr } = await supabase
    .from('crm_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (fetchErr || !userRow) {
    throw new Error('Usuário não encontrado.');
  }

  if (userRow.otp_type !== 'PASSWORD_RESET' || userRow.otp_code !== code.trim()) {
    throw new Error('Código de validação incorreto. Acesse seu e-mail e verifique o código.');
  }

  // Update password and clear recovery flags
  const { data: updatedData, error: updateErr } = await supabase
    .from('crm_users')
    .update({
      password: newPassword,
      otp_code: null,
      otp_type: null,
      otp_expires_at: null,
      status: userRow.status === 'PENDENTE' ? 'ATIVO' : userRow.status,
      is_verified: true,
    })
    .eq('id', userRow.id)
    .select()
    .single();

  if (updateErr) {
    throw new Error('Falha ao atualizar a senha: ' + updateErr.message);
  }

  return mapDbToUser(updatedData);
}

/**
 * Standard Login
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: userRow, error } = await supabase
    .from('crm_users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error || !userRow) {
    throw new Error('E-mail ou senha incorretos.');
  }

  if (userRow.password !== password) {
    throw new Error('E-mail ou senha incorretos.');
  }

  // Rule: Check if account is still pending verification
  if (userRow.status === 'PENDENTE' || userRow.is_verified === false) {
    const err = new Error(
      'Sua conta está pendente de ativação. Por favor, acesse seu e-mail e confirme o código OTP para liberar o acesso.'
    );
    (err as any).code = 'ACCOUNT_PENDING';
    (err as any).email = userRow.email;
    throw err;
  }

  // Rule: Check if login is locked due to active password reset
  if (userRow.otp_type === 'PASSWORD_RESET') {
    const err = new Error(
      'O login desta conta está temporariamente inativo pois uma recuperação de senha está em andamento. Conclua a troca de senha para reativar o acesso.'
    );
    (err as any).code = 'PASSWORD_RESET_PENDING';
    (err as any).email = userRow.email;
    throw err;
  }

  // Rule: Check if inactive
  if (userRow.status === 'INATIVO') {
    const err = new Error(
      'Sua conta está inativa. Entre em contato com a administração do CRM para reativação.'
    );
    (err as any).code = 'ACCOUNT_INACTIVE';
    throw err;
  }

  const user = mapDbToUser(userRow);
  setCurrentUserId(user.id);
  return user;
}

/**
 * Direct user creation by Admin
 */
export async function createSupabaseUser(input: CreateUserInput): Promise<User> {
  const userAvatar = input.avatar.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name.trim())}&background=6366f1&color=ffffff&bold=true`;

  const insertPayload = {
    name: input.name.trim(),
    cpf: input.cpf.trim(),
    email: input.email.trim().toLowerCase(),
    birth_date: input.birthDate,
    avatar: userAvatar,
    password: input.password || 'Password@123',
    role: 'USUARIO',
    status: 'ATIVO',
    is_verified: true,
    phone: input.phone?.trim() || null,
    department: input.department?.trim() || 'Geral',
  };

  const { data, error } = await supabase
    .from('crm_users')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbToUser(data);
}

/**
 * Profile update by self
 */
export async function updateSupabaseUserSelf(
  id: string,
  updates: UpdateUserProfileInput
): Promise<User> {
  const updatePayload: Record<string, any> = {
    avatar: updates.avatar,
    phone: updates.phone ?? null,
  };

  if (updates.name) {
    updatePayload.name = updates.name.trim();
  }

  const { data, error } = await supabase
    .from('crm_users')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbToUser(data);
}

/**
 * Full update by Admin
 */
export async function updateSupabaseUserByAdmin(
  id: string,
  updates: Partial<User>
): Promise<User> {
  const updatePayload: Record<string, any> = {};

  if (updates.status) updatePayload.status = updates.status;
  if (updates.role) updatePayload.role = updates.role;
  if (updates.department) updatePayload.department = updates.department;
  if (updates.name) updatePayload.name = updates.name;
  if (updates.phone !== undefined) updatePayload.phone = updates.phone;

  const { data, error } = await supabase
    .from('crm_users')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbToUser(data);
}

/**
 * Session storage
 */
export function getCurrentUserId(): string {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) || '';
  } catch {
    return '';
  }
}

export function setCurrentUserId(userId: string): void {
  try {
    if (userId) {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error('Error setting current user:', err);
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch (err) {
    console.error('Error clearing session:', err);
  }
}
