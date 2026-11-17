import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SMTP_USER = Deno.env.get("SMTP_USER") || "dunacuritiba@gmail.com";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "prtkkxqucxjanbev";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, otpCode, type } = await req.json();

    if (!email || !otpCode) {
      return new Response(
        JSON.stringify({ error: "E-mail e código OTP são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = name || "Usuário";
    const isReset = type === "PASSWORD_RESET";
    const subject = isReset
      ? `Recuperação de Senha - Código ${otpCode} - DunaCRM`
      : `Seu Código de Ativação: ${otpCode} - DunaCRM`;

    const title = isReset ? "Recuperação de Senha" : "Ativação de Conta";
    const message = isReset
      ? "Recebemos uma solicitação para redefinir a senha do seu acesso ao DunaCRM. Utilize o código de 6 dígitos abaixo para continuar a troca de senha:"
      : "Bem-vindo(a) ao DunaCRM! Para concluir seu cadastro e ativar seu acesso à plataforma, confirme o código de 6 dígitos abaixo:";

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">DunaCRM</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff; font-weight: 500;">Plataforma de Gestão em Saúde & Atendimento</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">${title}</h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Olá, <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #475569;">
                ${message}
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">Código de Verificação</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">${otpCode}</span>
                <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 8px;">Válido por 15 minutos</span>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                Copie este código e digite na tela do CRM para validar seu acesso. Se você não solicitou este código, por favor desconsidere este e-mail.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} DunaCRM • Todos os direitos reservados.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Duna CRM" <${SMTP_USER}>`,
      to: email,
      subject: subject,
      text: `${title}\n\nOlá ${userName},\n\nSeu código de verificação é: ${otpCode}\n\nVálido por 15 minutos.\n\nEquipe DunaCRM`,
      html: htmlContent,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro no envio:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Falha ao enviar e-mail." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
