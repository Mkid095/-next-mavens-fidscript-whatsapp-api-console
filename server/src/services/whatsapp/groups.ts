import { callEvolutionAPIChecked } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';
import { type SendContext, type SendResult, evolutionNameOf } from './shared.js';

/**
 * Group management — 16 ops, all FREE (no tokens). Every op proxies to Evolution's
 * /group/* surface, logs the request, and maps the gateway response to a SendResult.
 * groupJid/inviteCode travel as query params (Evolution's contract); mutations
 * carry their value in the body.
 */
interface Opts {
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
}

async function run(ctx: SendContext, slug: string, method: string, opts: Opts = {}): Promise<SendResult> {
  const name = encodeURIComponent(evolutionNameOf(ctx.instance));
  const qs = opts.query
    ? '?' + Object.entries(opts.query)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  const res = await callEvolutionAPIChecked(method, `/group/${slug}/${name}${qs}`, opts.body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `group.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

export const createGroup = (ctx: SendContext, a: { subject: string; description?: string; participants: string[] }) =>
  run(ctx, 'create', 'POST', { body: { subject: a.subject, description: a.description || '', participants: a.participants } });
export const updateGroupSubject = (ctx: SendContext, a: { groupJid: string; subject: string }) =>
  run(ctx, 'updateGroupSubject', 'POST', { query: { groupJid: a.groupJid }, body: { subject: a.subject } });
export const updateGroupDescription = (ctx: SendContext, a: { groupJid: string; description: string }) =>
  run(ctx, 'updateGroupDescription', 'POST', { query: { groupJid: a.groupJid }, body: { description: a.description } });
export const updateGroupPicture = (ctx: SendContext, a: { groupJid: string; image: string }) =>
  run(ctx, 'updateGroupPicture', 'POST', { query: { groupJid: a.groupJid }, body: { image: a.image } });
export const fetchAllGroups = (ctx: SendContext, getParticipants = false) =>
  run(ctx, 'fetchAllGroups', 'GET', { query: { getParticipants } });
export const findGroup = (ctx: SendContext, groupJid: string) =>
  run(ctx, 'findGroupInfos', 'GET', { query: { groupJid } });
export const findGroupMembers = (ctx: SendContext, groupJid: string) =>
  run(ctx, 'participants', 'GET', { query: { groupJid } });
export const updateParticipant = (ctx: SendContext, a: { groupJid: string; action: 'add' | 'remove' | 'promote' | 'demote'; participants: string[] }) =>
  run(ctx, 'updateParticipant', 'POST', { query: { groupJid: a.groupJid }, body: { action: a.action, participants: a.participants } });
export const inviteCode = (ctx: SendContext, groupJid: string) =>
  run(ctx, 'inviteCode', 'GET', { query: { groupJid } });
export const revokeInvite = (ctx: SendContext, groupJid: string) =>
  run(ctx, 'revokeInviteCode', 'POST', { query: { groupJid } });
export const findByInvite = (ctx: SendContext, inviteCode: string) =>
  run(ctx, 'inviteInfo', 'GET', { query: { inviteCode } });
export const acceptInvite = (ctx: SendContext, inviteCode: string) =>
  run(ctx, 'acceptInviteCode', 'GET', { query: { inviteCode } });
export const sendInvite = (ctx: SendContext, a: { groupJid: string; description: string; numbers: string[] }) =>
  run(ctx, 'sendInvite', 'POST', { body: { groupJid: a.groupJid, description: a.description, numbers: a.numbers } });
export const leaveGroup = (ctx: SendContext, groupJid: string) =>
  run(ctx, 'leaveGroup', 'DELETE', { query: { groupJid } });
export const toggleEphemeral = (ctx: SendContext, a: { groupJid: string; expiration: number }) =>
  run(ctx, 'toggleEphemeral', 'POST', { query: { groupJid: a.groupJid }, body: { expiration: a.expiration } });
export const updateGroupSetting = (ctx: SendContext, a: { groupJid: string; action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked' }) =>
  run(ctx, 'updateSetting', 'POST', { query: { groupJid: a.groupJid }, body: { action: a.action } });
