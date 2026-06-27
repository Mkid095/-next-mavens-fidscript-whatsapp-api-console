/**
 * Email provider abstraction. The rest of the app calls emailService.send /
 * .sendTemplate and never imports the provider directly. Swapping Resend for
 * SES / Postmark / SMTP is a single-file change here.
 */

export interface SendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  /** Provider's message id (e.g. Resend id) on success, for delivery tracking. */
  providerId: string | null;
  /** Human-readable error from the provider on failure. */
  error: string | null;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendInput): Promise<SendResult>;
}
