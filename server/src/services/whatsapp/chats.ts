import { callEvolutionAPIChecked } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';
import { type SendContext, type SendResult, evolutionNameOf } from './shared.js';

async function run(ctx: SendContext, slug: string, method: string, body?: Record<string, unknown>): Promise<SendResult> {
  const name = encodeURIComponent(evolutionNameOf(ctx.instance));
  const res = await callEvolutionAPIChecked(method, `/chat/${slug}/${name}`, body);
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
