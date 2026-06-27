import { emailService } from '../services/email/index.js';
import type { AuthCodePurpose } from './authCodes.js';

interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Send the magic-code email via the centralized email service. The service
 * handles the provider (Resend), HTML rendering, and send logging; this
 * wrapper preserves the existing { success, error } contract so callers
 * don't need to change.
 */
export async function sendMagicCodeEmail(
  toEmail: string,
  code: string,
  purpose: AuthCodePurpose
): Promise<SendResult> {
  const result = await emailService.sendTemplate({ template: 'magic-code', to: toEmail, code, purpose });
  return { success: result.success, error: result.success ? undefined : (result.error ?? 'Failed to send verification email') };
}