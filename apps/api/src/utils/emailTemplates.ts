import type { AuthCodePurpose } from './authCodes.js';

const BRAND = '#eab308';
const INK = '#181711';

interface TemplateContext {
  code: string;
  purposeText: string;
}

function renderTemplate({ code, purposeText }: TemplateContext): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Your FIDScript verification code</title>
</head>
<body style="margin:0;padding:0;background:#f4f4ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4ed;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:${INK};padding:24px 32px;border-top:4px solid ${BRAND};">
              <span style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">FIDSCRIPT</span>
              <span style="font-size:11px;color:${BRAND};font-weight:600;margin-left:6px;">WHATSAPP API</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 12px;">
              <h1 style="margin:0 0 8px;font-size:21px;font-weight:700;color:${INK};letter-spacing:-0.01em;">Your verification code</h1>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#525345;">${purposeText}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fffdf2;border:1px dashed ${BRAND};border-radius:12px;padding:22px 12px;text-align:center;">
                    <span style="font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;font-size:34px;font-weight:800;letter-spacing:14px;color:${INK};">${code}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#7d8071;">This code expires in <strong style="color:#525345;">10 minutes</strong>. If you didn't request it, you can safely ignore this email — no one has accessed your account.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eaebe4;padding-top:18px;">
                <tr>
                  <td style="font-size:11px;line-height:1.6;color:#a8a99e;">
                    FIDScript by Next Mavens<br>
                    <a href="https://whatsapp.fidscript.com" style="color:#a8a99e;text-decoration:none;">whatsapp.fidscript.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:#a8a99e;">© 2026 FIDScript. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function magicCodeEmailHTML(code: string, purpose: AuthCodePurpose): string {
  const purposeText =
    purpose === 'register'
      ? 'Use the code below to create your FIDScript account. Enter it on the verification screen to finish signing up.'
      : 'Use the code below to sign in to your FIDScript dashboard. Enter it on the verification screen to continue.';
  return renderTemplate({ code, purposeText });
}

export function magicCodeEmailText(code: string, purpose: AuthCodePurpose): string {
  const action = purpose === 'register' ? 'create your account' : 'sign in to your dashboard';
  return `Your FIDScript verification code is ${code}.

Enter this code to ${action}. The code expires in 10 minutes.

If you didn't request this code, you can safely ignore this email.

FIDScript by Next Mavens — https://whatsapp.fidscript.com`;
}
