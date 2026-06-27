import { callGatewayChecked } from '../../utils/gateway.js';
import { logApiRequest } from '../../utils/audit.js';
import { paceWhatsApp, type WhatsAppCallKind } from './whatsappCallLimiter.js';
import { type SendContext, type SendResult, gatewayNameOf } from './shared.js';

// Read slugs in this file: find*, fetchProfilePictureUrl, whatsappNumbers,
// getBase64FromMediaMessage. Everything else is a mutation (mark*, archive,
// deleteForEveryone, updateMessage, sendPresence).
const READ_SLUGS = new Set([
  'findChats', 'findContacts', 'findMessages', 'findStatusMessage',
  'fetchProfilePictureUrl', 'whatsappNumbers', 'getBase64FromMediaMessage',
]);

function kindFor(slug: string): WhatsAppCallKind {
  return READ_SLUGS.has(slug) ? 'read' : 'mutation';
}

async function run(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  // Pace the gateway→WhatsApp per instance so a "mark all read" loop or UI
  // presence polling can't blast the gateway. Reads (3 MPS) and mutations
  // (2 MPS) use independent per-instance pacers so neither can starve the
  // other — or the bulk-campaign send throughput.
  await paceWhatsApp(ctx.instance.id, kindFor(slug));
  const name = encodeURIComponent(gatewayNameOf(ctx.instance));
  const res = await callGatewayChecked(method, `/chat/${slug}/${name}`, body);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, res.status, `chat.${slug}`);
  if (!res.ok) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502;
    return { ok: false, status, error: (res.data.message as string) || (res.data.error as string) || 'Gateway request failed' };
  }
  return { ok: true, data: res.data as Record<string, unknown> };
}

// Chat state mutations (V1_MUTATE)
export const markRead = (ctx: SendContext, a: { readMessages: Array<{ key: { remoteJid: string; fromMe: boolean; id: string }; messageTimestamp?: number }> }) =>
  run(ctx, 'markMessageAsRead', 'POST', a);
export const markUnread = (ctx: SendContext, a: { lastMessage: Array<Record<string, unknown>>; chat: string }) =>
  run(ctx, 'markChatUnread', 'POST', a);
export const archiveChat = (ctx: SendContext, a: { lastMessage: Record<string, unknown>; archive: boolean; chat: string }) =>
  run(ctx, 'archiveChat', 'POST', a);
export const sendPresence = (ctx: SendContext, a: { number: string; options?: { presences?: string[] } }) =>
  run(ctx, 'sendPresence', 'POST', a);
export const deleteForEveryone = (ctx: SendContext, a: { id: string; remoteJid: string; fromMe: boolean; participant?: string }) =>
  run(ctx, 'deleteMessageForEveryone', 'DELETE', a);
export const updateMessage = (ctx: SendContext, a: { number: number; text: string; key: { remoteJid: string; fromMe: boolean; id: string } }) =>
  run(ctx, 'updateMessage', 'POST', a);

// Read ops (V1_READ)
export const findChats = (ctx: SendContext) => run(ctx, 'findChats', 'POST', {});
export const findContacts = (ctx: SendContext, where?: Record<string, unknown>) => run(ctx, 'findContacts', 'POST', where ? { where } : {});
export const findMessages = (ctx: SendContext, where?: Record<string, unknown>) => run(ctx, 'findMessages', 'POST', where ? { where } : {});
export const findStatus = (ctx: SendContext, where?: Record<string, unknown>, limit = 10) =>
  run(ctx, 'findStatusMessage', 'POST', { where: where || {}, limit });
export const isWhatsApp = (ctx: SendContext, numbers: string[]) => run(ctx, 'whatsappNumbers', 'POST', { numbers });
export const getBase64 = (ctx: SendContext, a: { message: Record<string, unknown>; convertToMp4?: boolean }) =>
  run(ctx, 'getBase64FromMediaMessage', 'POST', a);
export const profilePicUrl = (ctx: SendContext, number: string) => run(ctx, 'fetchProfilePictureUrl', 'POST', { number });
