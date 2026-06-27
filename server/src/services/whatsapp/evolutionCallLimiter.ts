/**
 * Evolution call rate limiter — paces every Evolution read (find-chats,
 * find-messages, find-contacts, profilePicUrl) made by our backend so we
 * never blast the Evolution→WhatsApp layer, especially during a new-
 * container initial sync.
 *
 * Per-instance: a SendPacer at EVOLUTION_READ_MPS (default 3 calls/sec).
 * That's ~180/min per instance — well under any WhatsApp read ceiling while
 * still feeling responsive. The portal's 10/sec route cap and the frontend
 * shared refresh gate sit ABOVE this; the Evolution cap is the last-mile
 * protection against WhatsApp account blocks.
 *
 * Tunable via EVOLUTION_READ_MPS.
 */

import { SendPacer } from './sendThroughput.js';

const DEFAULT_READ_MPS = Number(process.env.EVOLUTION_READ_MPS ?? 3);
const pacers = new Map<string, SendPacer>();

/** Block (await) until this instance is allowed to make another Evolution call. */
export async function paceEvolutionCall(instanceId: string | number): Promise<void> {
  const key = String(instanceId);
  let pacer = pacers.get(key);
  if (!pacer) {
    pacer = new SendPacer(DEFAULT_READ_MPS);
    pacers.set(key, pacer);
  }
  await pacer.waitForSlot();
}

/** Drop the limiter for an instance (e.g. on disconnect/delete) so memory doesn't grow. */
export function clearEvolutionPacer(instanceId: string | number): void {
  pacers.delete(String(instanceId));
}