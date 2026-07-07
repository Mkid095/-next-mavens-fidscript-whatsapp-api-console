import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

// Configured Resend client, or null if no API key is present (e.g. local dev
// without email). Callers should guard on this before sending.
export const resend: Resend | null = apiKey ? new Resend(apiKey) : null;

// Sender address — domain must be verified in the Resend dashboard.
export const MAIL_FROM =
  process.env.MAIL_FROM || 'FIDScript <noreply@whatsapp.fidscript.com>';
