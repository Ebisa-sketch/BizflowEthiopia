export interface PasswordResetEmailOptions {
  userName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function passwordResetTemplate({
  userName,
  resetUrl,
  expiresInMinutes = 60,
}: PasswordResetEmailOptions): { subject: string; html: string; text: string } {
  const greeting = userName ? `Hello ${userName},` : "Hello,";
  const subject = "Reset your BizFlow Ethiopia password";

  const text = `
${greeting}

We received a request to reset your password for your BizFlow Ethiopia account.

Click the link below to set a new password (valid for ${expiresInMinutes} minutes):
${resetUrl}

If you did not request this, please disregard this email or contact your business administrator.

— The BizFlow Ethiopia Team
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #071924; color: #E2E8F0; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background-color: #0B2230; border: 1px solid #184257; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #071924 0%, #0E2736 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #184257; }
    .brand { font-size: 22px; font-weight: 800; color: #00D287; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .title { font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
    .lead { font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #00D287; color: #071924 !important; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; }
    .btn:hover { background-color: #00b875; }
    .note { font-size: 12px; color: #64748B; line-height: 1.5; border-top: 1px solid #184257; padding-top: 20px; margin-top: 28px; }
    .link-alt { word-break: break-all; color: #00D287; font-size: 12px; }
    .footer { text-align: center; font-size: 12px; color: #64748B; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">⚡ BizFlow Ethiopia</div>
    </div>
    <div class="content">
      <h1 class="title">Reset your password</h1>
      <p class="lead">${greeting}</p>
      <p class="lead">We received a request to reset the password for your BizFlow Ethiopia account. Click the button below to choose a new password:</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>

      <p class="lead" style="font-size: 13px;">This link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
      
      <div class="note">
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}" class="link-alt">${resetUrl}</a></p>
      </div>
    </div>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} BizFlow Ethiopia. Modern POS & ERP for Ethiopian Businesses.
  </div>
</body>
</html>
`.trim();

  return { subject, html, text };
}
