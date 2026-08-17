/**
 * Email templates - single source of truth for the HTML/text bodies the
 * centralized email service renders. Adding a new email is one entry here
 * + the service routes on it; no per-callsite HTML.
 */

export interface MagicCodeVars {
  code: string;
  purpose: 'login' | 'register';
}

export interface TokenAwardVars {
  clientName: string;
  amount: number;
  adminNote?: string;
}

export type TemplateVars =
  | ({ template: 'magic-code' } & MagicCodeVars)
  | ({ template: 'token-award' } & TokenAwardVars);

const MAGIC_CODE_SUBJECT = (vars: MagicCodeVars) => `${vars.code} - your FIDScript verification code`;

function magicCodeHtml(vars: MagicCodeVars): string {
  const intent = vars.purpose === 'register' ? 'create your FIDScript account' : 'sign in to FIDScript';
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#0c0b06;color:#cbd3cf;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#14130d;border:1px solid #2b291a;border-radius:16px;padding:32px;">
    <h1 style="color:#eab308;margin:0 0 8px;font-size:20px;">Your verification code</h1>
    <p style="color:#8f8c6d;margin:0 0 24px;font-size:14px;">Use this 6-digit code to ${intent}. It expires in 10 minutes.</p>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;letter-spacing:8px;text-align:center;background:#1e1d13;border:1px solid #38351c;border-radius:12px;padding:24px;color:#fff;font-weight:700;">${vars.code}</div>
    <p style="color:#6a6c5d;margin:24px 0 0;font-size:12px;">If you didn't request this, you can safely ignore the email.</p>
    <p style="color:#6a6c5d;margin:16px 0 0;font-size:11px;">- FIDScript by Next Mavens</p>
  </div>
</body></html>`;
}
function magicCodeText(vars: MagicCodeVars): string {
  return `Your FIDScript verification code: ${vars.code}\n\nExpires in 10 minutes. If you didn't request this, ignore this email.`;
}

const TOKEN_AWARD_SUBJECT = (vars: TokenAwardVars) =>
  `You've been awarded ${vars.amount.toLocaleString()} FIDScript tokens`;

function tokenAwardHtml(vars: TokenAwardVars): string {
  const note = vars.adminNote
    ? `<p style="color:#8f8c6d;margin:0 0 16px;font-size:13px;background:#1a1910;border-left:3px solid #eab308;padding:12px;">Note from our team: ${vars.adminNote}</p>`
    : '';
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#0c0b06;color:#cbd3cf;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#14130d;border:1px solid #2b291a;border-radius:16px;padding:32px;">
    <h1 style="color:#eab308;margin:0 0 8px;font-size:20px;">${vars.amount.toLocaleString()} tokens credited</h1>
    <p style="color:#8f8c6d;margin:0 0 24px;font-size:14px;">Hi ${vars.clientName}, an administrator has credited your FIDScript account with <strong style="color:#fff;">${vars.amount.toLocaleString()}</strong> tokens.</p>
    ${note}
    <p style="color:#6a6c5d;margin:24px 0 0;font-size:12px;">Sign in to your dashboard to see your updated balance.</p>
    <p style="color:#6a6c5d;margin:16px 0 0;font-size:11px;">- FIDScript by Next Mavens</p>
  </div>
</body></html>`;
}
function tokenAwardText(vars: TokenAwardVars): string {
  const note = vars.adminNote ? `\n\nNote: ${vars.adminNote}` : '';
  return `Hi ${vars.clientName},\n\nAn administrator has credited your FIDScript account with ${vars.amount.toLocaleString()} tokens.${note}\n\nSign in to your dashboard to see your updated balance.\n\n- FIDScript by Next Mavens`;
}

/** Resolve a template + vars into a ready-to-send payload. Throws on unknown template. */
export function renderTemplate(
  vars: TemplateVars,
): { to: string; subject: string; html: string; text: string; template: string } {
  if (vars.template === 'magic-code') {
    return {
      to: '', // caller supplies
      subject: MAGIC_CODE_SUBJECT(vars),
      html: magicCodeHtml(vars),
      text: magicCodeText(vars),
      template: 'magic-code',
    };
  }
  if (vars.template === 'token-award') {
    return {
      to: '',
      subject: TOKEN_AWARD_SUBJECT(vars),
      html: tokenAwardHtml(vars),
      text: tokenAwardText(vars),
      template: 'token-award',
    };
  }
  // Exhaustive check - adding a new template without handling it here is a build error.
  const _exhaustive: never = vars;
  throw new Error(`Unknown email template: ${(vars as TemplateVars).template}`);
}