export type UserRole = 'ADMIN' | 'USUARIO';
export type UserStatus = 'ATIVO' | 'INATIVO' | 'PENDENTE';
export type OtpType = 'REGISTRATION' | 'PASSWORD_RESET';

export interface User {
  id: string;
  name: string;
  cpf: string; // Format: 000.000.000-00
  email: string;
  birthDate: string; // Format: YYYY-MM-DD
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  department?: string;
  password?: string;
  otpCode?: string | null;
  otpExpiresAt?: string | null;
  otpType?: OtpType | null;
  isVerified?: boolean;
}

export interface CreateUserInput {
  name: string;
  cpf: string;
  email: string;
  birthDate: string;
  avatar: string;
  phone?: string;
  department?: string;
  password?: string;
}

export interface SignUpInput extends CreateUserInput {
  password: string;
  confirmPassword?: string;
}

export interface UpdateUserProfileInput {
  avatar: string;
  phone?: string;
  name?: string;
}

export interface FormErrors {
  name?: string;
  cpf?: string;
  email?: string;
  birthDate?: string;
  avatar?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
  general?: string;
}

export type AuthScreen =
  | 'login'
  | 'register'
  | 'verify-registration-otp'
  | 'forgot-password'
  | 'verify-reset-otp'
  | 'reset-password';
