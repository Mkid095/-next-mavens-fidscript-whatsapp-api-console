/**
 * Send token award notification email via Resend.
 * Non-blocking: catches errors and logs without throwing so the API response
 * is never failed due to an email delivery problem.
 */
import { resend, MAIL_FROM } from './resend.js';
import { tokenAwardEmailHTML, tokenAwardEmailText } from './tokenAwardEmail.js';

interface SendResult { success: boolean; error?: string; }

export async function sendTokenAwardEmail(
  toEmail: string,
  clientName: string,
  amount: number,
  adminNote?: string,
): Promise<SendResult> {
  if (!resend) {
    console.warn('[token-award] RESEND_API_KEY not set — email not sent.');
    return { success: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: toEmail,
      subject: `You've been awarded ${amount.toLocaleString()} FIDScript tokens`,
      html: tokenAwardEmailHTML(clientName, amount, adminNote),
      text: tokenAwardEmailText(clientName, amount, adminNote),
    });
    if (error) {
      console.error('[token-award] Resend error:', error);
      return { success: false, error: 'Failed to send award email' };
    }
    return { success: true };
  } catch (err) {
    console.error('[token-award] Send exception:', err);
    return { success: false, error: 'Failed to send award email' };
  }
}
