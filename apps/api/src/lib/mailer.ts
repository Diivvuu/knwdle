// src/lib/mailer.ts
import nodemailer, { Transporter } from 'nodemailer';
import { env, isProd } from './env';

export type MailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string; // optional; auto-generated if omitted
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
    tls: { rejectUnauthorized: isProd },
    pool: true,
    maxConnections: Number(process.env.MAIL_MAX_CONNECTIONS || 5),
    maxMessages: Number(process.env.MAIL_MAX_MESSAGES || 100),
    rateDelta: 1000,
    rateLimit: Number(process.env.MAIL_RATE_LIMIT || 0),
  });

  // verify once on first use so failures are visible in logs
  cachedTransporter.verify().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[mailer] SMTP verify failed', err);
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
export async function sendMail(
  _to: string | string[],
  _subject: string,
  _html: string,
  _text?: string
) {
  const transporter = getTransporter();

  const to = Array.isArray(_to) ? _to.join(', ') : _to;
  const subject = _subject;
  const html = _html;
  const text = _text ?? htmlToText(_html);

  try {
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mailer] sendMail failed', err);
    throw err;
  }
}

// small helpers

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  let idx = 0;
  const run = async () => {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, run)
  );
  return out;
}

export async function sendBulkWithProgress(
  items: Array<{ to: string; subject: string; html: string; text?: string }>,
  opts: {
    concurrency?: number;
    retry?: number;
    backOffMs?: number;
    onPRogress?: number;
    onProgress?: (ok: boolean) => void;
  } = {}
) {
  const {
    concurrency = Number(process.env.MAIL_CONCURRENCY || 5),
    retry = 1,
    backOffMs = 600,
    onProgress,
  } = opts;

  return mapWithConcurrency(items, concurrency, async (m) => {
    let attempt = 0;

    while (true) {
      try {
        const res = await sendMail(m.to, m.subject, m.html, m.text);
        onProgress?.(true);
        return res;
      } catch (error) {
        if (attempt >= retry) {
          onProgress?.(false);
          throw error;
        }
        attempt++;
        await wait(backOffMs);
      }
    }
  });
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
