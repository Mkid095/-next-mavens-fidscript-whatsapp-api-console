import { callEvolutionAPIChecked } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';
import { type SendContext, type SendResult, evolutionNameOf } from './shared.js';

async function run(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  const name = encodeURIComponent(evolutionNameOf(ctx.instance));
  const res = await callEvolutionAPIChecked(method, `/chat/${slug}/${name}`, body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `profile.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

async function runSettings(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  const name = encodeURIComponent(evolutionNameOf(ctx.instance));
  const res = await callEvolutionAPIChecked(method, `/settings/${slug}/${name}`, body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `settings.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

// Profile — reads V1_READ, updates V1_STRICT
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

// Settings — reads V1_READ, updates V1_STRICT
export const findSettings = (ctx: SendContext) =>
  runSettings(ctx, 'find', 'GET');
export const setSettings = (ctx: SendContext, a: { rejectCall?: boolean; msgCall?: string; groupsIgnore?: boolean; alwaysOnline?: boolean; readMessages?: boolean; readStatus?: boolean; syncFullHistory?: boolean }) =>
  runSettings(ctx, 'set', 'POST', a);
