// src/lib/mailer.ts
import nodemailer, { Transporter } from 'nodemailer';
import { env, isProd } from './env';

export type MailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;        // optional; auto-generated if omitted
  headers?: Record<string, string>;
  replyTo?: string;
};

let cachedTransporter: Transporter | null = null;

/** Lazily create (and reuse) a transporter */
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // common convention
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    // Some providers need this to avoid TLS version quirks
    tls: { rejectUnauthorized: isProd },
  });

  return cachedTransporter;
}

/** Very light HTML->text fallback */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|br|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Universal sendMail util
 * - Reuses a single SMTP transporter
 * - Auto-generates plain text if not provided
 * - Returns provider messageId for logs/audit
 */
export async function sendMail(_to: string | string[], _subject: string, _html: string, _text?: string) {
  const transporter = getTransporter();

  const to = Array.isArray(_to) ? _to.join(', ') : _to;
  const subject = _subject;
  const html = _html;
  const text = _text ?? htmlToText(_html);

  const info = await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
    text,
    headers: {
      'X-Knwdle-Env': env.NODE_ENV,
      'X-Transactional': 'true',
    },
  });

  return { messageId: info.messageId };
}

/**
 * Optional helper: small HTML wrapper with brand-safe layout.
 * Usage: wrapHtml({ title: 'Verify Email', bodyHtml: '<p>…</p>' })
 */
export function wrapHtml(opts: { title?: string; bodyHtml: string }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${opts.title ?? 'Notification'}</title>
</head>
<body style="margin:0;background:#f6f7fb;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr>
      <td style="padding:20px 24px;background:#111;color:#fff;font-weight:600;font-size:16px">
        knwdle
      </td>
    </tr>
    <tr>
      <td style="padding:24px;font-size:14px;line-height:1.6">
        ${opts.bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;font-size:12px;color:#666;background:#fafafa">
        This is a transactional email from knwdle.
      </td>
    </tr>
  </table>
</body>
</html>`;
}
