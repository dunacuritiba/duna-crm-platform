import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import nodemailer from 'nodemailer';

function otpEmailPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'otp-email-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-otp', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { email, name, otpCode, type } = JSON.parse(body);

            if (!email || !otpCode) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'E-mail e código OTP são obrigatórios.' }));
              return;
            }

            const isRegistration = type === 'REGISTRATION';
            const subject = isRegistration
              ? `NexusCRM - Seu Código de Ativação: ${otpCode}`
              : `NexusCRM - Seu Código de Recuperação de Senha: ${otpCode}`;

            const htmlContent = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                <div style="margin-bottom: 24px; text-align: center;">
                  <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Nexus<span style="color: #0284c7;">CRM</span></h1>
                  <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Plataforma de Gestão e Relacionamento</p>
                </div>
                
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
                  <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 12px 0;">
                    ${isRegistration ? 'Ativação de Cadastro' : 'Recuperação de Senha'}
                  </h2>
                  <p style="color: #475569; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
                    ${
                      isRegistration
                        ? `Olá, <strong>${name || 'Usuário'}</strong>! Recebemos seu cadastro no NexusCRM. Para ativar sua conta e liberar seu acesso, utilize o código de verificação abaixo:`
                        : `Olá! Recebemos uma solicitação de redefinição de senha para sua conta no NexusCRM. Para cadastrar sua nova senha, utilize o código de verificação abaixo:`
                    }
                  </p>
                  
                  <div style="text-align: center; margin: 24px 0;">
                    <span style="font-family: monospace, Consolas, Courier; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; background-color: #eef2ff; border: 2px dashed #c7d2fe; padding: 12px 28px; border-radius: 12px; display: inline-block;">
                      ${otpCode}
                    </span>
                  </div>

                  <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                    ⏱️ Este código expira em <strong>15 minutos</strong>.
                  </p>
                </div>

                <p style="color: #94a3b8; font-size: 12px; line-height: 18px; text-align: center; margin: 0;">
                  Se você não solicitou este código, nenhuma ação é necessária. Por segurança, nunca compartilhe este código com terceiros.
                </p>
              </div>
            `;

            let dispatched = false;
            let providerUsed = '';

            // ============================================================
            // 1ª PRIORIDADE: GOOGLE SMTP (sempre tenta primeiramente no Google)
            // ============================================================
            const smtpUser = env.SMTP_USER || process.env.SMTP_USER;
            const smtpPass = env.SMTP_PASS || process.env.SMTP_PASS;
            const smtpHost = env.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
            const smtpPort = Number(env.SMTP_PORT || process.env.SMTP_PORT || 587);

            if (smtpUser && smtpPass) {
              try {
                console.log(`[EMAIL] 1ª Tentativa: Enviando via Google SMTP (${smtpUser}) para ${email}...`);
                const transporter = nodemailer.createTransport({
                  host: smtpHost,
                  port: smtpPort,
                  secure: smtpPort === 465,
                  auth: {
                    user: smtpUser,
                    pass: smtpPass.trim(),
                  },
                  tls: {
                    rejectUnauthorized: false,
                  },
                });

                const fromHeader = env.SMTP_FROM
                  ? env.SMTP_FROM.includes('<')
                    ? env.SMTP_FROM
                    : `"${env.SMTP_FROM}" <${smtpUser}>`
                  : `"Nexus CRM" <${smtpUser}>`;

                await transporter.sendMail({
                  from: fromHeader,
                  to: email,
                  subject,
                  html: htmlContent,
                });

                dispatched = true;
                providerUsed = 'Google SMTP';
                console.log(`[EMAIL - SUCESSO] E-mail enviado com sucesso via Google SMTP para ${email}!`);
              } catch (smtpErr: any) {
                console.warn(
                  `[EMAIL - AVISO] Google SMTP falhou (${smtpErr?.message || smtpErr}). Ativando contingência via Resend...`
                );
              }
            }

            // ============================================================
            // 2ª PRIORIDADE (FALLBACK): RESEND
            // Se o Google não der certo ou não estiver configurado, usa o Resend
            // ============================================================
            if (!dispatched) {
              const resendKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
              if (resendKey) {
                try {
                  console.log(`[EMAIL] 2ª Tentativa (Contingência): Enviando via Resend para ${email}...`);
                  const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${resendKey.trim()}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'Nexus CRM <onboarding@resend.dev>',
                      to: [email],
                      subject,
                      html: htmlContent,
                    }),
                  });

                  if (resendResponse.ok) {
                    dispatched = true;
                    providerUsed = 'Resend';
                    console.log(`[EMAIL - SUCESSO] E-mail enviado com sucesso via Resend para ${email}!`);
                  } else {
                    const errorText = await resendResponse.text();
                    console.error('[EMAIL - ERRO RESEND]:', errorText);
                  }
                } catch (resendErr: any) {
                  console.error('[EMAIL - EXCEÇÃO RESEND]:', resendErr?.message || resendErr);
                }
              }
            }

            if (!dispatched) {
              console.error(
                `[EMAIL - FALHA TOTAL] Não foi possível enviar e-mail para ${email} nem pelo Google SMTP nem pelo Resend.`
              );
            }

            // Responde sucesso ao frontend sem expor o código OTP na tela/resposta
            res.end(
              JSON.stringify({
                success: dispatched,
                provider: providerUsed,
                message: dispatched
                  ? `E-mail enviado com sucesso para ${email}.`
                  : 'Falha no envio de e-mail.',
              })
            );
          } catch (err: any) {
            console.error('[EMAIL DISPATCH ERROR]:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Falha ao processar envio de e-mail.' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      otpEmailPlugin(env),
    ],
  };
});
