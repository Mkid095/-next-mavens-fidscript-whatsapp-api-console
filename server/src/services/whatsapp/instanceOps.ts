import { callEvolutionAPIChecked } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';
import { type SendContext, type SendResult, evolutionNameOf } from './shared.js';

async function run(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  const name = encodeURIComponent(evolutionNameOf(ctx.instance));
  const res = await callEvolutionAPIChecked(method, `/instance/${slug}/${name}`, body);
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

/** Connect — generates a QR (no logout-first; use connectWithLogout for the full flow). */
export const connectInstance = async (ctx: SendContext, number?: string): Promise<SendResult> => {
  const name = encodeURIComponent(evolutionNameOf(ctx.instance));
  const qs = number ? `?number=${encodeURIComponent(number)}` : '';
  const res = await callEvolutionAPIChecked('GET', `/instance/connect/${name}${qs}`);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, 'instance.connect');
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
};

/** Full connect flow: logout first (clears old session), then generate fresh QR. */
export const connectWithLogout = async (ctx: SendContext, number?: string): Promise<SendResult> => {
  const logoutResult = await logout(ctx);
  if (!logoutResult.ok) return logoutResult;
  return connectInstance(ctx, number);
};
