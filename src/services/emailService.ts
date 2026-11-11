export interface SendOtpEmailParams {
  email: string;
  name?: string;
  otpCode: string;
  type: 'REGISTRATION' | 'PASSWORD_RESET';
}

/**
 * Dispatches OTP email via the backend API.
 * The backend handles delivery via Resend or SMTP.
 * Note: The OTP is NOT returned in the response to ensure security.
 */
export async function sendOtpEmail(params: SendOtpEmailParams): Promise<boolean> {
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Alerta ao despachar e-mail:', errData?.message || res.statusText);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro ao conectar ao serviço de envio de e-mails:', err);
    return false;
  }
}
