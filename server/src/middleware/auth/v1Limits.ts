import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Per-client rate limiters for the /api/v1 surface, keyed by the authenticated
 * client (falling back to IP if req.client is unset — e.g. on the public spec
 * routes). Distinct buckets prevent read-heavy endpoints from exhausting the
 * send budget and vice-versa.
 *
 *   sends   → plan-based clientRateLimit (msg_per_min)            [messages]
 *   reads   → V1_READ  (600/min)   find/fetch/usage/spec          [chats reads, profile reads]
 *   mutate  → V1_MUTATE (120/min)  group & chat mutations          [groups, chat mutations]
 *   strict  → V1_STRICT  (30/min)  profile updates, restart/logout [profile updates, instance lifecycle]
 */
function clientKey(req: Request): string {
  return req.client?.id ? `cli_${req.client.id}` : `ip_${req.ip ?? 'unknown'}`;
}

function makeClientLimiter(maxPerMin: number, label: string) {
  return rateLimit({
    windowMs: 60 * 1000,
    max: maxPerMin,
    keyGenerator: clientKey,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: `${label} rate limit exceeded` },
  });
}

export const V1_READ = makeClientLimiter(600, 'Read');
export const V1_MUTATE = makeClientLimiter(120, 'Mutation');
export const V1_STRICT = makeClientLimiter(30, 'Strict');
