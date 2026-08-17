import { callGatewayChecked } from '../../utils/gateway.js';
import { logApiRequest } from '../../utils/audit.js';
import { paceWhatsApp, type WhatsAppCallKind } from './whatsappCallLimiter.js';
import { type SendContext, type SendResult, gatewayNameOf } from './shared.js';

const PROFILE_READ_SLUGS = new Set(['fetchProfile', 'fetchPrivacySettings']);
const SETTINGS_READ_SLUGS = new Set(['find']);

function profileKind(slug: string): WhatsAppCallKind { return PROFILE_READ_SLUGS.has(slug) ? 'read' : 'mutation'; }
function settingsKind(slug: string): WhatsAppCallKind { return SETTINGS_READ_SLUGS.has(slug) ? 'read' : 'mutation'; }

async function run(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  await paceWhatsApp(ctx.instance.id, profileKind(slug));
  const name = encodeURIComponent(gatewayNameOf(ctx.instance));
  const res = await callGatewayChecked(method, `/chat/${slug}/${name}`, body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `profile.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

async function runSettings(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  await paceWhatsApp(ctx.instance.id, settingsKind(slug));
  const name = encodeURIComponent(gatewayNameOf(ctx.instance));
  const res = await callGatewayChecked(method, `/settings/${slug}/${name}`, body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `settings.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

// Profile - reads V1_READ, updates V1_STRICT
export const fetchProfile = (ctx: SendContext, number: string) =>
  run(ctx, 'fetchProfile', 'POST', { number });
export const fetchPrivacySettings = (ctx: SendContext) =>
  run(ctx, 'fetchPrivacySettings', 'GET');
export const updateProfileName = (ctx: SendContext, name: string) =>
  run(ctx, 'updateProfileName', 'POST', { name });
export const updateProfileStatus = (ctx: SendContext, status: string) =>
  run(ctx, 'updateProfileStatus', 'POST', { status });
export const updateProfilePicture = (ctx: SendContext, picture: string) =>
  run(ctx, 'updateProfilePicture', 'POST', { picture });
export const removeProfilePicture = (ctx: SendContext) =>
  run(ctx, 'removeProfilePicture', 'DELETE');

// Settings - reads V1_READ, updates V1_STRICT
export const findSettings = (ctx: SendContext) =>
  runSettings(ctx, 'find', 'GET');
export const setSettings = (ctx: SendContext, a: { rejectCall?: boolean; msgCall?: string; groupsIgnore?: boolean; alwaysOnline?: boolean; readMessages?: boolean; readStatus?: boolean; syncFullHistory?: boolean }) =>
  runSettings(ctx, 'set', 'POST', a);
