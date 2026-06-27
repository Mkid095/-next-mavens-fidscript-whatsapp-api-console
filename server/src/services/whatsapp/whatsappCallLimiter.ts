/**
 * the gateway call rate limiter — paces every the gateway read/mutation made by
 * our backend so we never blast the the gateway→WhatsApp layer.
 *
 * Two independent pacers per instance, kept separate so a chat-mirror spike
 * can't starve campaign sends and vice versa:
 *
 *   reads    → EVOLUTION_READ_MPS     (default 3/sec)  — find-chats,
 *               find-messages, find-contacts, profilePic, fetchProfile, etc.
 *   mutations → EVOLUTION_MUTATION_MPS (default 2/sec)  — markRead,
 *               updateParticipant, sendPresence, setSettings, etc.
 *
 * Both are well under WhatsApp's send throughput ceiling (~80 MPS) and
 * conservative enough that even a rapid UI loop can't trigger an account
 * block. Sends are paced separately by the bulk-campaign SendPacer
 * (10/30 MPS) and the 1:1 composer in-flight guard — they intentionally
 * do NOT route through this limiter.
 */

import { SendPacer } from './sendThroughput.js';

const DEFAULT_READ_MPS = Number(process.env.EVOLUTION_READ_MPS ?? 3);
const DEFAULT_MUTATION_MPS = Number(process.env.EVOLUTION_MUTATION_MPS ?? 2);

const readPacers = new Map<string, SendPacer>();
const mutationPacers = new Map<string, SendPacer>();

export type WhatsAppCallKind = 'read' | 'mutation';

/** Block (await) until this instance is allowed to make another the gateway call of `kind`. */
export async function paceWhatsApp(instanceId: string | number, kind: WhatsAppCallKind = 'read'): Promise<void> {
  const key = String(instanceId);
  const map = kind === 'mutation' ? mutationPacers : readPacers;
  const mps = kind === 'mutation' ? DEFAULT_MUTATION_MPS : DEFAULT_READ_MPS;
  let pacer = map.get(key);
  if (!pacer) {
    pacer = new SendPacer(mps);
    map.set(key, pacer);
  }
  await pacer.waitForSlot();
}

// Backward-compatible aliases (existing callers — chatMirror / phonebook).
export const paceWhatsAppCall = (instanceId: string | number) => paceWhatsApp(instanceId, 'read');
export const paceWhatsAppRead = (instanceId: string | number) => paceWhatsApp(instanceId, 'read');
export const paceWhatsAppMutation = (instanceId: string | number) => paceWhatsApp(instanceId, 'mutation');

/** Drop both pacers for an instance (e.g. on disconnect/delete) so memory doesn't grow. */
export function clearWhatsAppPacer(instanceId: string | number): void {
  readPacers.delete(String(instanceId));
  mutationPacers.delete(String(instanceId));
}