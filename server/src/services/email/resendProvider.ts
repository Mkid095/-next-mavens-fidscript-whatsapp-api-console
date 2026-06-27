/**
 * Resend provider implementation. Single source of truth for talking to
 * Resend — swap to a different provider by writing a new class that
 * implements EmailProvider and changing the export in ./index.ts.
 */
import { Resend } from 'resend';
import { MAIL_FROM } from '../../utils/resend.js';
import type { EmailProvider, SendInput, SendResult } from './provider.js';

const apiKey = process.env.RESEND_API_KEY;
const resend: Resend | null = apiKey ? new Resend(apiKey) : null;

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';

  async send(input: SendInput): Promise<SendResult> {
    if (!resend) {
      return { success: false, providerId: null, error: 'RESEND_API_KEY not configured' };
    }
    try {
      const { data, error } = await resend.emails.send({
        from: MAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      if (error) {
        // Resend returns errors as objects (name/message/statusCode) — surface the message
        // so we can diagnose (e.g. "domain not verified", "test mode", invalid API key).
        return { success: false, providerId: null, error: error.message || String(error) };
      }
      return { success: true, providerId: data?.id ?? null, error: null };
    } catch (err) {
      return { success: false, providerId: null, error: err instanceof Error ? err.message : String(err) };
    }
  }
}