import {
  sendText, sendMedia, sendLocation, sendContact,
} from '../../services/whatsapp/messaging.js';
import {
  isOkResult,
  type SendContext, type SendResult, type ContactCard,
} from '../../services/whatsapp/shared.js';
import { normalizePhone } from '../../utils/phone.js';

// =============================================================================
// Campaign dispatch — shared with 1:1 chat (spec §15: never drift).
// Campaign send paths MUST call these helpers, never callGateway
// directly. Token charging, finalize, message.sent events, idempotency all
// come from the shared senders — adding a new send type (Phase 2 §2 senders)
// extends campaigns automatically.
// =============================================================================

export type CampaignMessageKind = 'text' | 'media' | 'location' | 'contact';

export interface CampaignSendArgs {
  /** Per-recipient unique key — used for idempotency wrapSend replay. */
  recipientId: string;
  to: string;
  kind: CampaignMessageKind;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  contact?: ContactCard[];
}

export interface CampaignSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Resolve a phone number for an outgoing campaign send. Normalizes to the
 * canonical +254… form for Kenyan DMs; group JIDs (@g.us) pass through.
 * Returns null when the value is unusable (the caller marks the recipient
 * failed and continues).
 */
export function campaignNormalizePhone(to: string): string | null {
  const n = normalizePhone(to);
  if (!n) return null;
  return n;
}

const newIdempKey = (campaignId: string, recipientId: string): string =>
  `camp_${campaignId}_${recipientId}`;

export { newIdempKey as idempotencyKeyFor };

/**
 * Dispatch a single campaign message via the shared senders.
 *
 * Returns `{ ok, messageId?, error? }`. Does NOT throw — the caller is in a
 * long-running send loop and must handle per-recipient failures gracefully.
 *
 * The underlying sender handles:
 *  - connection-state check (`requireConnected`)
 *  - token charge + ledger write (`chargeAndEmit`)
 *  - idempotency cache (uses `Idempotency-Key: camp_<campaignId>_<recipientId>`)
 *  - gateway call + refund on failure
 *  - `inbox_messages` row + `message.sent` event
 */
export async function dispatchCampaignMessage(
  ctx: SendContext,
  args: CampaignSendArgs
): Promise<CampaignSendResult> {
  const idempotencyKey = newIdempKey(String(ctx.instance.id || ''), args.recipientId);

  // Stamp the idempotency key onto the request so wrapSend picks it up.
  // The shared senders read `req.get('idempotency-key')` to gate the
  // idempotency table. We mutate the header (Express req is plain object).
  const reqAny = ctx.req as unknown as { headers: Record<string, string>; get(name: string): string | undefined };
  const priorKey = reqAny.get('idempotency-key');
  if (!reqAny.headers) reqAny.headers = {} as Record<string, string>;
  reqAny.headers['idempotency-key'] = idempotencyKey;

  let result: SendResult;
  try {
    switch (args.kind) {
      case 'text':
        result = await sendText(ctx, { to: args.to, message: args.text || '' });
        break;
      case 'media':
        result = await sendMedia(ctx, {
          to: args.to,
          media_url: args.mediaUrl || '',
          media_type: args.mediaType || 'image',
          caption: args.caption || args.text || '',
        });
        break;
      case 'location':
        result = await sendLocation(ctx, {
          to: args.to,
          latitude: args.latitude ?? 0,
          longitude: args.longitude ?? 0,
          name: args.locationName,
          address: args.address,
        });
        break;
      case 'contact':
        result = await sendContact(ctx, {
          to: args.to,
          contact: args.contact || [],
        });
        break;
      default:
        result = { ok: false, status: 400, error: `Unknown campaign message kind: ${args.kind}` };
    }
  } catch (err) {
    result = { ok: false, status: 500, error: err instanceof Error ? err.message : String(err) };
  } finally {
    // Restore prior header so subsequent recipients don't see this key.
    if (priorKey !== undefined) reqAny.headers['idempotency-key'] = priorKey;
    else delete reqAny.headers['idempotency-key'];
  }

  if (isOkResult(result)) {
    const data = result.data as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  }
  return { ok: false, error: result.error };
}

/**
 * Compact a campaign row for event payloads. Avoid leaking unrelated fields
 * to the bus.
 */
export function campaignEventMeta(row: {
  id: string;
  workspace_id?: string | null;
  type?: string | null;
  name?: string;
}): Record<string, unknown> {
  return {
    id: row.id,
    workspaceId: row.workspace_id ?? null,
    type: row.type ?? 'broadcast',
    name: row.name ?? '',
  };
}
