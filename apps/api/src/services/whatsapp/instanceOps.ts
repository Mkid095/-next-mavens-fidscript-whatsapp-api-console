import { callGatewayChecked } from '../../utils/gateway.js';
import { logApiRequest } from '../../utils/audit.js';
import { paceWhatsApp, type WhatsAppCallKind } from './whatsappCallLimiter.js';
import { overlayLogoOnQR } from '../../utils/qrLogo.js';
import { type SendContext, type SendResult, gatewayNameOf } from './shared.js';

// QR generation (connectInstance) is heavy - gate it to one call per 10s per
// instance so a UI retry loop can't hammer it.
const connectCooldown = new Map<string, number>();
const CONNECT_COOLDOWN_MS = 10_000;

// Instance ops are mostly mutation-heavy (logout/restart/setPresence); reads
// are just connectionState + connect (heavy QR fetch). Reads 3 MPS, mutations
// 2 MPS per instance - conservative enough to prevent restart loops or
// presence polling from triggering an account block.
const READ_SLUGS = new Set(['connectionState', 'connect']);
function kindFor(slug: string): WhatsAppCallKind { return READ_SLUGS.has(slug) ? 'read' : 'mutation'; }

async function run(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  await paceWhatsApp(ctx.instance.id, kindFor(slug));
  const name = encodeURIComponent(gatewayNameOf(ctx.instance));
  const res = await callGatewayChecked(method, `/instance/${slug}/${name}`, body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `instance.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

export const connectionState = (ctx: SendContext) => run(ctx, 'connectionState', 'GET');
export const logout = (ctx: SendContext) => run(ctx, 'logout', 'DELETE');
export const setPresence = (ctx: SendContext, presence: 'available' | 'unavailable') =>
  run(ctx, 'setPresence', 'POST', { presence });
export const restart = (ctx: SendContext) => run(ctx, 'restart', 'PUT');

/** Connect - generates a QR (no logout-first; use connectWithLogout for the full flow). */
export const connectInstance = async (ctx: SendContext, number?: string): Promise<SendResult> => {
  const key = String(ctx.instance.id);
  const last = connectCooldown.get(key) ?? 0;
  const since = Date.now() - last;
  if (since < CONNECT_COOLDOWN_MS) {
    return { ok: false, status: 429, error: `QR generation is rate-limited to 1 per ${CONNECT_COOLDOWN_MS / 1000}s. Try again shortly.` };
  }
  connectCooldown.set(key, Date.now());
  await paceWhatsApp(ctx.instance.id, 'read');
  const name = encodeURIComponent(gatewayNameOf(ctx.instance));
  const qs = number ? `?number=${encodeURIComponent(number)}` : '';
  const res = await callGatewayChecked('GET', `/instance/connect/${name}${qs}`);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, 'instance.connect');
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }

  // Apply branding: recolor QR from blue-on-white to forest-deep and overlay logo
  const data = res.data as Record<string, unknown>;
  const qrcode = (data.qrcode as { code?: string; base64?: string } | undefined) || data;
  const rawQr = (qrcode?.base64 as string | undefined) || (qrcode?.code as string | undefined) || '';
  if (rawQr) {
    try {
      const brandedQr = await overlayLogoOnQR(rawQr);
      // Return branded QR as both qrcode.base64 and qrcode.code for compatibility
      data.qrcode = { base64: brandedQr, code: brandedQr };
    } catch (err) {
      // Branding failed - return raw QR (never block on logo overlay failure)
      console.warn('[instanceOps] QR branding failed, returning raw QR:', err);
    }
  }

  return { ok: true, data };
};

/** Full connect flow: logout first (clears old session), then generate fresh QR. */
export const connectWithLogout = async (ctx: SendContext, number?: string): Promise<SendResult> => {
  const logoutResult = await logout(ctx);
  if (!logoutResult.ok) return logoutResult;
  return connectInstance(ctx, number);
};
