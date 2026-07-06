import { normalizePhone } from '../../utils/phone.js';

// Shared webhook helpers + the instance row shape every handler uses.
export interface WebhookInstance {
  id: number;
  name: string;
  client_id: string;
  evolution_name?: string;
}

/** Build the dispatch/resolve context (client_id = workspace_id bridge). */
export function buildWsCtx(instance: WebhookInstance) {
  const workspaceId = instance.client_id;
  return { workspaceId, userId: workspaceId, roleId: 'role_0', perms: ['*'] };
}

/** Extract phone from a WhatsApp JID like "254700000000@s.whatsapp.net". */
export function extractPhoneFromJid(sender: string | null | undefined): string | null {
  if (!sender) return null;
  const match = sender.match(/^(\d+)@/);
  if (!match) return null;
  return `+${match[1]}`;
}

/** Canonical chat_id from a remote JID: group JID passthrough, else normalized phone. */
export function chatIdFromJid(remoteJid: string): { chatId: string; isGroup: boolean; phone: string | null } {
  const isGroup = remoteJid.includes('@g.us');
  const phone = remoteJid ? extractPhoneFromJid(remoteJid) : null;
  const chatId = isGroup ? remoteJid : (phone ? normalizePhone(phone) : remoteJid);
  return { chatId, isGroup, phone };
}
