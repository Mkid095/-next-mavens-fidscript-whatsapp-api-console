import { resend, MAIL_FROM } from './resend.js';
import { magicCodeEmailHTML, magicCodeEmailText } from './emailTemplates.js';
import type { AuthCodePurpose } from './authCodes.js';

interface SendResult {
  success: boolean;
  error?: string;
}

/** Send the magic-code email via Resend. No-ops (success) if Resend is not configured. */
export async function sendMagicCodeEmail(
  toEmail: string,
  code: string,
  purpose: AuthCodePurpose
): Promise<SendResult> {
  if (!resend) {
    console.warn('[magic-code] RESEND_API_KEY not set — email not sent.');
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: toEmail,
      subject: `${code} — your FIDScript verification code`,
      html: magicCodeEmailHTML(code, purpose),
      text: magicCodeEmailText(code, purpose),
    });

    if (error) {
      console.error('[magic-code] Resend error:', error);
      return { success: false, error: 'Failed to send verification email' };
    }

    return { success: true };
  } catch (err) {
    console.error('[magic-code] Send exception:', err);
    return { success: false, error: 'Failed to send verification email' };
  }
}
