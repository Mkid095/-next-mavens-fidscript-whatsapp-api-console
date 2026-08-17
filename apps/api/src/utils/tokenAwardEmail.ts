/**
 * Token award email - branded HTML + plain-text render functions.
 * Used by sendTokenAwardEmail.ts to notify clients of admin-awarded tokens.
 */

export function tokenAwardEmailHTML(clientName: string, amount: number, adminNote?: string): string {
  const BRAND = '#eab308';
  const INK = '#181711';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>You've been awarded FIDScript tokens</title>
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
              <h1 style="margin:0 0 8px;font-size:21px;font-weight:700;color:${INK};letter-spacing:-0.01em;">You've been awarded tokens</h1>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#525345;">
                Hello <strong>${clientName}</strong>, FIDScript Admin has added
                <strong style="color:${INK};font-size:16px;">${amount.toLocaleString()} tokens</strong> to your account.
              </p>
              ${adminNote ? `<p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#525345;background:#f9f9f2;border-left:3px solid ${BRAND};padding:12px 16px;border-radius:0 8px 8px 0;"><strong>Note:</strong> ${adminNote}</p>` : ''}
              <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#7d8071;">
                Your new token balance will be reflected immediately in your dashboard.
                Tokens can be used to send WhatsApp messages via the FIDScript API.
              </p>
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

export function tokenAwardEmailText(clientName: string, amount: number, adminNote?: string): string {
  return `Hello ${clientName},

FIDScript Admin has awarded you ${amount.toLocaleString()} tokens.

${adminNote ? `Note: ${adminNote}\n` : ''}
Your new token balance will be reflected immediately in your dashboard.

FIDScript by Next Mavens - https://whatsapp.fidscript.com`;
}
