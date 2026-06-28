/**
 * Outbound volume tracking — WhatsApp caps the number of UNIQUE customers a
 * business can INITIATE a conversation with in a rolling 24-hour period.
 *
 *   Tier 0 (unverified / new accounts): 250 unique users / day
 *   Tier 1 (verified):                  1,000
 *   Tier 2:                             10,000
 *   Tier 3:                             100,000
 *   Tier 4:                             unlimited (enterprise)
 *
 * Tier auto-upgrades when the account maintains a high quality rating AND
 * uses ≥50% of its current limit consistently over 7 days. We surface the
 * current usage in the UI so clients can plan toward that 50% threshold.
 *
 * Source of truth: `inbox_messages` — distinct chat_ids the instance has sent
 * an outgoing message to in the last 24h. No new table needed; the webhook
 * and finalize() already persist outgoing messages with direction='outgoing'.
 */

import db from '../../database.js';

export type Tier = 0 | 1 | 2 | 3 | 4;

export interface OutboundUsage {
  uniqueInitiationsToday: number;
  tier: Tier;
  tierLimit: number;             // numeric cap; Number.POSITIVE_INFINITY for Tier 4
  upgradeThreshold: number;      // 50% of tierLimit — the target to trigger upgrade
  windowStart: string;            // ISO 24h ago
  resetsAt: string;               // ISO when the rolling window slides past the oldest init
  remaining: number;              // tierLimit - uniqueInitiationsToday (Infinity for Tier 4)
  pct: number;                    // 0..100 (capped at 100)
  canSend: boolean;               // remaining > 0 (always true for Tier 4)
}

const TIER_LIMITS: Record<Tier, number> = {
  0: 250,
  1: 1000,
  2: 10000,
  3: 100000,
  4: Number.POSITIVE_INFINITY,
};

function resolveTier(): Tier {
  const raw = (process.env.OUTBOUND_TIER ?? '0').trim();
  const n = Number(raw);
  if (n >= 0 && n <= 4 && Number.isInteger(n)) return n as Tier;
  return 0;
}

/** Count distinct contacts the given instance sent an outgoing message to in the last 24h.
 *  chat_id can be a full JID (254746269657@s.whatsapp.net) or a normalized phone (+254746269657).
 *  Normalize before COUNT(DISTINCT) so the same contact counted via different formats → 1. */
export function uniqueInitiationsInLast24h(instanceId: string | number, clientId: string): number {
  const row = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN chat_id LIKE '%@%' THEN REPLACE(chat_id, '@s.whatsapp.net', '')
        ELSE REPLACE(chat_id, '+', '')
      END
    ) as c
    FROM inbox_messages
    WHERE instance_id = ?
      AND client_id = ?
      AND direction = 'outgoing'
      AND timestamp >= datetime('now', '-24 hours')
  `).get(String(instanceId), clientId) as { c: number } | undefined;
  return row?.c ?? 0;
}

/** Compute the full outbound usage snapshot for an instance. */
export function getOutboundUsage(instanceId: string | number, clientId: string): OutboundUsage {
  const tier = resolveTier();
  const tierLimit = TIER_LIMITS[tier];
  const uniqueInitiationsToday = uniqueInitiationsInLast24h(instanceId, clientId);
  const remaining = tier === 4 ? Number.POSITIVE_INFINITY : Math.max(0, tierLimit - uniqueInitiationsToday);
  const upgradeThreshold = Math.ceil(tierLimit / 2);
  const pct = tier === 4 ? 0 : Math.min(100, (uniqueInitiationsToday / tierLimit) * 100);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const oldest = db.prepare(`
    SELECT timestamp FROM inbox_messages
    WHERE instance_id = ? AND client_id = ? AND direction = 'outgoing'
    ORDER BY timestamp ASC LIMIT 1
  `).get(String(instanceId), clientId) as { timestamp: string } | undefined;

  // Approx "when does the window free up the oldest initiation" — 24h after
  // the oldest in-window message. For Tier 4 it's never.
  const resetsAt = tier === 4 || !oldest
    ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    : new Date(new Date(oldest.timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString();

  return {
    uniqueInitiationsToday,
    tier,
    tierLimit,
    upgradeThreshold,
    windowStart,
    resetsAt,
    remaining,
    pct,
    canSend: remaining > 0,
  };
}

/**
 * How many of the given candidate chat_ids would actually be NEW initiations
 * (not yet messaged by this instance in the last 24h). Used by bulk dispatch
 * to compute the true cost against the tier limit.
 */
export function newInitiationsInBatch(
  instanceId: string | number,
  clientId: string,
  candidateChatIds: string[]
): number {
  if (candidateChatIds.length === 0) return 0;
  const initiated = new Set<string>(
    (db.prepare(`
      SELECT DISTINCT chat_id FROM inbox_messages
      WHERE instance_id = ? AND client_id = ?
        AND direction = 'outgoing'
        AND timestamp >= datetime('now', '-24 hours')
    `).all(String(instanceId), clientId) as { chat_id: string }[]).map((r) => {
      const id = r.chat_id;
      // Normalize: strip @s.whatsapp.net suffix and + prefix so JID and phone forms merge
      return id.includes('@')
        ? id.replace('@s.whatsapp.net', '')
        : id.replace(/^\+/, '');
    })
  );
  let newCount = 0;
  for (const id of candidateChatIds) {
    const normalized = id.includes('@') ? id.replace('@s.whatsapp.net', '') : id.replace(/^\+/, '');
    if (id && !initiated.has(normalized)) newCount++;
  }
  return newCount;
}