/**
 * Send token award notification email via the centralized email service.
 * Non-blocking: callers don't need to change - the service logs success /
 * failure and returns the result.
 */
import { emailService } from '../services/email/index.js';

interface SendResult { success: boolean; error?: string; }

export async function sendTokenAwardEmail(
  toEmail: string,
  clientName: string,
  amount: number,
  adminNote?: string,
): Promise<SendResult> {
  const result = await emailService.sendTemplate({
    template: 'token-award',
    to: toEmail,
    clientName,
    amount,
    adminNote,
  });
  return { success: result.success, error: result.success ? undefined : (result.error ?? 'Failed to send award email') };
}