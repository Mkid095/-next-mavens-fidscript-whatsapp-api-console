/**
 * Centralized email service — the ONLY way the rest of the app sends email.
 *
 * Usage from any backend module:
 *
 *   import { emailService } from '../services/email/index.js';
 *   await emailService.send({ to, subject, html, text });
 *   await emailService.sendTemplate({ template: 'magic-code', to, code, purpose });
 *
 * Or via the internal HTTP endpoint (for cross-service / async use):
 *   POST /api/internal/email/send
 *
 * Every send is logged to `email_send_log` so delivery can be audited and
 * silent failures (e.g. Resend test mode, unverified domain) become visible
 * instead of the user wondering why no email arrived.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { renderTemplate, type TemplateVars } from './templates.js';
import { ResendProvider } from './resendProvider.js';
import type { EmailProvider, SendInput, SendResult } from './provider.js';

// Default provider — swap this one line to change email backends.
const provider: EmailProvider = new ResendProvider();

interface LogRow {
  id: string;
  to_email: string;
  subject: string;
  template: string | null;
  provider: string;
  provider_id: string | null;
  status: 'sent' | 'failed';
  error: string | null;
  created_at: string;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string | null;
}

export const emailService = {
  /** Low-level: send a pre-rendered email. Provider-agnostic. */
  async send(input: OutboundEmail): Promise<SendResult> {
    const sendInput: SendInput = {
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    const result = await provider.send(sendInput);
    logSend({ to: input.to, subject: input.subject, template: input.template ?? null }, result);
    return result;
  },

  /**
   * Template-based: pick a template name + vars, the service renders and
   * sends. The TS union of templates makes it a build error to add a new
   * template without routing it through renderTemplate.
   */
  async sendTemplate(args: TemplateVars & { to: string }): Promise<SendResult> {
    const rendered = renderTemplate(args);
    return this.send({ ...rendered, to: args.to, template: args.template });
  },

  /** Test-only / diagnostic — returns the active provider name. */
  providerName(): string {
    return provider.name;
  },
};

function logSend(
  meta: { to: string; subject: string; template: string | null },
  result: SendResult,
): void {
  const row: LogRow = {
    id: uuidv4(),
    to_email: meta.to,
    subject: meta.subject,
    template: meta.template,
    provider: provider.name,
    provider_id: result.providerId,
    status: result.success ? 'sent' : 'failed',
    error: result.error,
    created_at: new Date().toISOString(),
  };
  try {
    db.prepare(
      `INSERT INTO email_send_log
        (id, to_email, subject, template, provider, provider_id, status, error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(row.id, row.to_email, row.subject, row.template, row.provider, row.provider_id, row.status, row.error, row.created_at);
  } catch (err) {
    // Never let logging break a send.
    console.error('[email] failed to write send log:', err instanceof Error ? err.message : err);
  }
  if (!result.success) {
    console.error(`[email] ${provider.name} send FAILED → ${meta.to} (${meta.template ?? 'raw'}): ${result.error}`);
  } else {
    console.log(`[email] ${provider.name} send OK → ${meta.to} (${meta.template ?? 'raw'}) id=${result.providerId}`);
  }
}

/** Read recent send log entries (for the internal / email endpoint). */
export function recentEmailLog(limit = 50): LogRow[] {
  const r = db.prepare(
    `SELECT id, to_email, subject, template, provider, provider_id, status, error, created_at
     FROM email_send_log ORDER BY created_at DESC LIMIT ?`
  ).all(limit) as unknown as LogRow[];
  return r;
}