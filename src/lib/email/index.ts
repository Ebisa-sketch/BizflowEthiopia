import { passwordResetTemplate } from "./templates";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  fromEmail: string;
  resendApiKey?: string;
}

function getEmailConfig(): EmailConfig {
  return {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    fromEmail: process.env.SMTP_FROM || process.env.EMAIL_FROM || "BizFlow Ethiopia <noreply@bizflow.et>",
    resendApiKey: process.env.RESEND_API_KEY,
  };
}

/**
 * Universal email sender that supports:
 * 1. Resend API (HTTP, zero external dependencies)
 * 2. Nodemailer SMTP (if configured and available)
 * 3. Graceful fallback to development/console logger
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const from = options.from || config.fromEmail;

  // 1. Resend API via HTTP fetch (ideal for serverless / edge / Docker)
  if (config.resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error("[EMAIL] Resend delivery failed:", errData);
        return { success: false, error: errData };
      }

      const data = (await response.json()) as { id?: string };
      return { success: true, messageId: data.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[EMAIL] Resend dispatch exception:", msg);
      return { success: false, error: msg };
    }
  }

  // 2. SMTP Transport
  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    try {
      const nodemailer = await import("nodemailer");

      if (nodemailer && typeof nodemailer.createTransport === "function") {
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpSecure,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        return { success: true, messageId: info.messageId };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[EMAIL] SMTP transport failed:", msg);
      return { success: false, error: msg };
    }
  }

  // 3. Fallback: Log email details in development/test or unconfigured environments
  console.log(`[EMAIL_SIMULATED] To: ${options.to} | Subject: "${options.subject}"`);
  return {
    success: true,
    simulated: true,
    messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  };
}

/**
 * High-level helper for dispatching branded password reset emails.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string
): Promise<SendEmailResult> {
  const { subject, html, text } = passwordResetTemplate({
    userName,
    resetUrl,
    expiresInMinutes: 60,
  });

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}
