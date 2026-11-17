import { supabase } from './supabase';

export interface SendOtpEmailParams {
  email: string;
  name?: string;
  otpCode: string;
  type: 'REGISTRATION' | 'PASSWORD_RESET';
}

/**
 * Dispatches OTP email directly via Supabase Edge Function 'send-otp'.
 * The Supabase Edge Function securely handles SMTP delivery to the user's real email inbox.
 */
export async function sendOtpEmail(params: SendOtpEmailParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: {
        email: params.email.trim().toLowerCase(),
        name: params.name || 'Usuário',
        otpCode: params.otpCode,
        type: params.type,
      },
    });

    if (error) {
      console.warn('Erro ao disparar e-mail via Supabase Edge Function:', error);
      return false;
    }

    if (data?.error) {
      console.warn('Alerta retornado pela função de envio:', data.error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro ao conectar ao serviço de envio de e-mails do Supabase:', err);
    return false;
  }
}
