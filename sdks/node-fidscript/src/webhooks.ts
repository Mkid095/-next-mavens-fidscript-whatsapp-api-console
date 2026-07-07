/**
 * webhooks.ts — /api/v1/webhooks + webhook signature verification + replay protection
 */
import crypto from 'crypto';
import type { Webhook } from '@fidscript/types';
import type { FidscriptClient } from './client.js';

/**
 * Result of a verified incoming webhook from FIDScript.
 * Returned by `verifySignature()` when the HMAC is valid.
 */
export interface VerifiedWebhook {
  /** The FIDScript event type, e.g. 'message.received', 'shopify.order.created' */
  event: string;
  /** The workspace ID this event belongs to */
  workspaceId: string;
  /** The unique delivery ID */
  deliveryId: string;
  /** The raw event payload */
  payload: Record<string, unknown>;
}

// ─── Replay protection ─────────────────────────────────────────────────────────

/**
 * In-memory delivery ID tracker for replay attack prevention.
 *
 * FIDScript webhooks include X-FIDScript-Delivery header with a unique delivery ID.
 * Even if an attacker captures a signed webhook, they cannot replay it because the
 * SDK consumer rejects any ID already seen in the last `maxAgeMs`.
 *
 * Usage:
 * ```ts
 * const tracker = new WebhookDeliveryTracker();
 *
 * app.post('/webhook', express.raw(), (req, res) => {
 *   const verified = verifySignature(req.body, req.headers, secret);
 *   if (!tracker.mark(verified.deliveryId)) {
 *     return res.status(409).json({ error: 'Duplicate delivery' });
 *   }
 *   // process event...
 *   res.json({ ok: true });
 * });
 * ```
 */
export class WebhookDeliveryTracker {
  private seen = new Map<string, number>(); // deliveryId → timestamp (ms)

  /**
   * Maximum age in ms for a delivery ID to be considered fresh.
   * IDs older than this are cleaned up and treated as potential replays.
   * Default: 5 minutes.
   */
  readonly maxAgeMs: number;

  /**
   * How often to prune expired entries. Default: every 100 calls.
   */
  readonly pruneEvery: number;

  private calls = 0;

  constructor(maxAgeMs = 5 * 60 * 1000, pruneEvery = 100) {
    this.maxAgeMs = maxAgeMs;
    this.pruneEvery = pruneEvery;
  }

  /**
   * Check and record a delivery ID.
   * Returns `true` if this is a fresh (unseen) delivery — safe to process.
   * Returns `false` if this ID was already seen — reject as a replay.
   */
  mark(deliveryId: string): boolean {
    if (!deliveryId || deliveryId === 'unknown') return true; // skip if no ID

    const now = Date.now();
    const lastSeen = this.seen.get(deliveryId);

    if (lastSeen !== undefined && now - lastSeen < this.maxAgeMs) {
      return false; // replay — already seen within maxAgeMs window
    }

    this.seen.set(deliveryId, now);

    if (++this.calls % this.pruneEvery === 0) {
      this.prune(now);
    }

    return true;
  }

  /** Remove expired entries from memory. */
  private prune(now: number): void {
    for (const [id, ts] of this.seen) {
      if (now - ts >= this.maxAgeMs) this.seen.delete(id);
    }
  }
}

// ─── Signature verification ────────────────────────────────────────────────────

/**
 * Verify and parse an incoming FIDScript webhook.
 *
 * Call this at the top of your webhook handler before processing the event.
 * If verification fails, this throws — do not process the payload.
 *
 * @param rawBody  - Raw request body as Buffer or string (NOT yet parsed JSON)
 * @param headers  - Request headers (lowercase keys recommended, case-insensitive)
 * @param secret   - The webhook signing secret returned when the webhook was created
 *
 * @example
 * ```ts
 * app.post('/webhooks/fidscript', express.raw(), (req, res) => {
 *   const verified = fs.webhooks.verifySignature(
 *     req.body,
 *     req.headers,
 *     process.env.FIDSCRIPT_WEBHOOK_SECRET!,
 *   );
 *   console.log('Event:', verified.event, 'Workspace:', verified.workspaceId);
 *   // safe to process verified.payload here
 *   res.json({ ok: true });
 * });
 * ```
 */
export function verifySignature(
  rawBody: Buffer | string,
  headers: Record<string, string | undefined | string[]>,
  secret: string,
): VerifiedWebhook {
  const sig = getHeader(headers, 'x-fidscript-signature');
  if (!sig) throw new Error('Missing X-FIDScript-Signature header');

  const deliveryId = getHeader(headers, 'x-fidscript-delivery') ?? 'unknown';
  const event = getHeader(headers, 'x-fidscript-event') ?? 'unknown';

  const bodyBuf = typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody;
  const expected = crypto.createHmac('sha256', secret).update(bodyBuf).digest('hex');

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    isValid = false;
  }
  if (!isValid) throw new Error('Webhook signature verification failed');

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(bodyBuf.toString('utf8')) as Record<string, unknown>;
  } catch { /* empty body is valid for some events */ }

  return {
    event,
    workspaceId: typeof payload.workspace_id === 'string' ? payload.workspace_id : '',
    deliveryId,
    payload,
  };
}

function getHeader(headers: Record<string, string | undefined | string[]>, key: string): string {
  const val = headers[key];
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] ?? '');
  return val;
}

export class WebhooksResource {
  constructor(private client: FidscriptClient) {}

  /**
   * GET /api/v1/webhooks
   */
  list() {
    return this.client.request<{ success: boolean; data: Webhook[] }>(
      'GET', '/api/v1/webhooks', undefined, { auth: 'apikey' },
    );
  }

  /**
   * POST /api/v1/webhooks
   */
  create(body: { url: string; events: string[] }) {
    return this.client.request<{ success: boolean; data: Webhook & { secret: string } }>(
      'POST', '/api/v1/webhooks', body, { auth: 'apikey' },
    );
  }

  /**
   * DELETE /api/v1/webhooks/:id
   */
  delete(id: string) {
    return this.client.request<{ success: boolean }>(
      'DELETE', `/api/v1/webhooks/${id}`, undefined, { auth: 'apikey' },
    );
  }
}
