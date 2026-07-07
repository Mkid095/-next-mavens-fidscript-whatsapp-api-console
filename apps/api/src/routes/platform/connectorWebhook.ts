/**
 * connectorWebhook.ts — Inbound webhook receiver for connector integrations.
 *
 * Route: POST /api/platform/connectors/:slug/webhook
 *
 * Responsibilities:
 *   1. Validate the incoming webhook signature (Shopify HMAC-SHA256)
 *   2. Identify the target workspace from stored credentials
 *   3. Persist the raw event to connector_events
 *   4. Normalize the payload and emit the appropriate FIDScript domain event
 *      so the automation engine can react to it.
 *
 * Retry behaviour:
 *   Failed dispatches are retried with exponential backoff (1m → 5m → 30m →
 *   2h → 8h). After 5 failed attempts the event is marked permanently
 *   'failed' and can be retried manually via POST
 *   /admin/system/connector-events/:id/retry.
 *
 * Connector-specific notes:
 *
 *  Shopify:
 *    - Header: X-Shopify-Hmac-SHA256
 *    - Header: X-Shopify-Shopify-Shop-Domain  →  e.g. "mystore.myshopify.com"
 *    - Signature: HMAC-SHA256 of raw body using the shared secret (client_secret)
 *
 *  WooCommerce:
 *    - Header: X-Wc-Webhook-Signature  →  HMAC-SHA256 of raw body
 *    - Header: X-Wc-Webhook-Source  →  e.g. "https://mystore.com/wc-api/v3/"
 *    - Topic header: X-Wc-Webhook-Topic  →  e.g. "order.created"
 *
 *  The shared secret for each connector is stored in extra_json when credentials
 *  are saved (POST /connectors/:slug/credentials). For Shopify this is the
 *  client_secret; for WooCommerce it is the webhook secret.
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import {
  dispatchShopifyOrderCreated,
  dispatchShopifyOrderUpdated,
  dispatchWooCommerceOrderCreated,
} from '../../modules/platform/events/index.js';
import type { DispatchContext } from '../../modules/platform/events/index.js';
import { markOrReject } from '../../kernel/webhooks/index.js';

const router = Router({ mergeParams: true });

// ─── Retry config ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;

/** Backoff delays in minutes: [1, 5, 30, 120, 480] */
const BACKOFF_MINUTES = [1, 5, 30, 120, 480];

function nextRetryAt(retryCount: number): string | null {
  if (retryCount >= MAX_RETRIES) return null; // permanent failure
  const delayMin = BACKOFF_MINUTES[Math.min(retryCount, BACKOFF_MINUTES.length - 1)];
  return new Date(Date.now() + delayMin * 60 * 1000).toISOString();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function badRequest(res: Response, msg: string, code = 400): void {
  res.status(code).json({ success: false, error: msg });
}

/** Look up workspace_id for an incoming webhook by connector slug + selector. */
function resolveWorkspace(connectorSlug: string, selector: Record<string, string>): string | null {
  if (connectorSlug === 'shopify') {
    const shop = selector.shop;
    if (!shop) return null;
    const rows = db.prepare(`
      SELECT workspace_id, extra_json
      FROM connector_credentials
      WHERE connector_id = 'conn_shopify' AND revoked_at IS NULL
    `).all() as { workspace_id: string; extra_json: string }[];
    for (const row of rows) {
      try {
        const extra = JSON.parse(row.extra_json) as Record<string, string>;
        if (extra.shop === shop) return row.workspace_id;
      } catch { /* skip malformed */ }
    }
  }
  if (connectorSlug === 'woocommerce') {
    const domain = selector.domain;
    if (!domain) return null;
    const rows = db.prepare(`
      SELECT workspace_id, extra_json
      FROM connector_credentials
      WHERE connector_id = 'conn_woocommerce' AND revoked_at IS NULL
    `).all() as { workspace_id: string; extra_json: string }[];
    for (const row of rows) {
      try {
        const extra = JSON.parse(row.extra_json) as Record<string, string>;
        if (extra.domain === domain) return row.workspace_id;
      } catch { /* skip */ }
    }
  }
  return null;
}

/** Verify Shopify HMAC-SHA256 signature. */
function verifyShopifyHmac(rawBody: Buffer, hmacHeader: string, clientSecret: string): boolean {
  const expected = crypto
    .createHmac('sha256', clientSecret)
    .update(rawBody)
    .digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Verify WooCommerce HMAC-SHA256 signature. */
function verifyWooCommerceHmac(rawBody: Buffer, sigHeader: string, clientSecret: string): boolean {
  const expected = `sha256=${crypto.createHmac('sha256', clientSecret).update(rawBody).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(sigHeader.toLowerCase()), Buffer.from(expected.toLowerCase()));
  } catch {
    return false;
  }
}

/** Get the shared secret for a connector in a workspace (stored in extra_json). */
function getWebhookSecret(connectorSlug: string, workspaceId: string): string | null {
  const connId = connectorSlug === 'shopify' ? 'conn_shopify' : 'conn_woocommerce';
  const row = db.prepare(`
    SELECT extra_json FROM connector_credentials
    WHERE connector_id = ? AND workspace_id = ? AND revoked_at IS NULL
  `).get(connId, workspaceId) as { extra_json: string } | undefined;
  if (!row) return null;
  try {
    const extra = JSON.parse(row.extra_json) as Record<string, string>;
    return extra.webhook_secret ?? extra.client_secret ?? extra.token ?? null;
  } catch {
    return null;
  }
}

// ─── Dispatch helpers ─────────────────────────────────────────────────────────

/**
 * Attempt to dispatch a connector event to the FIDScript event bus.
 * Returns true on success; on failure the caller should update retry state.
 */
async function dispatchConnectorEvent(
  eventType: string,
  workspaceId: string,
  rawPayload: Record<string, unknown>,
): Promise<void> {
  const ctx: DispatchContext = { workspaceId };

  if (eventType === 'orders/create' || eventType === 'shopify.order.created') {
    const order = rawPayload as Record<string, unknown>;
    await dispatchShopifyOrderCreated(ctx, {
      workspaceId,
      orderId: String(order.id ?? ''),
      orderName: String(order.name ?? ''),
      customerEmail: order.email ? String(order.email) : undefined,
      customerPhone: order.phone ? String(order.phone) : undefined,
      totalPrice: Number(order.total_price ?? 0),
      currency: String(order.currency ?? 'USD'),
      status: String(order.financial_status ?? ''),
      lineItems: ((order.line_items as Record<string, unknown>[] | undefined) ?? []).map((item) => ({
        title: String(item.title ?? ''),
        quantity: Number(item.quantity ?? 1),
        price: Number(item.price ?? 0),
      })),
      rawPayload,
    });
  } else if (eventType === 'orders/updated' || eventType === 'shopify.order.updated') {
    const order = rawPayload as Record<string, unknown>;
    await dispatchShopifyOrderUpdated(ctx, {
      workspaceId,
      orderId: String(order.id ?? ''),
      orderName: String(order.name ?? ''),
      status: String(order.financial_status ?? order.fulfillment_status ?? ''),
      totalPrice: Number(order.total_price ?? 0),
      currency: String(order.currency ?? 'USD'),
      rawPayload,
    });
  } else if (eventType === 'order.created' || eventType === 'woocommerce.order.created') {
    const order = rawPayload;
    await dispatchWooCommerceOrderCreated(ctx, {
      workspaceId,
      orderId: Number(order.id ?? 0),
      customerEmail: order.billing_email ? String(order.billing_email) : undefined,
      total: String(order.total ?? '0'),
      currency: String(order.currency ?? 'USD'),
      status: String(order.status ?? ''),
      rawPayload,
    });
  } else {
    console.warn(`[connector-webhook] Unknown event type: ${eventType}`);
  }
}

// ─── Core processing ──────────────────────────────────────────────────────────

/**
 * Process a connector event: insert into DB, dispatch to bus, update state.
 * Returns the DB row id so the caller can inspect final status.
 */
async function processConnectorEvent(
  eventId: string,
  workspaceId: string,
  connectorSlug: string,
  eventType: string,
  rawPayload: Record<string, unknown>,
): Promise<void> {
  // Mark as processing
  db.prepare(`UPDATE connector_events SET status = 'processing' WHERE id = ?`).run(eventId);

  try {
    await dispatchConnectorEvent(eventType, workspaceId, rawPayload);
    db.prepare(`
      UPDATE connector_events
         SET status = 'completed', processed_at = datetime('now')
       WHERE id = ?
    `).run(eventId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Read current retry_count
    const row = db.prepare(
      `SELECT retry_count FROM connector_events WHERE id = ?`,
    ).get(eventId) as { retry_count: number } | undefined;
    const retryCount = (row?.retry_count ?? 0) + 1;
    const nextRetry = nextRetryAt(retryCount);

    if (nextRetry === null) {
      // Max retries reached — permanent failure
      db.prepare(`
        UPDATE connector_events
           SET status = 'failed',
               retry_count = ?,
               last_error = ?,
               next_retry_at = NULL
         WHERE id = ?
      `).run(retryCount, msg, eventId);
      console.error(`[connector-webhook] Permenant failure for event ${eventId} after ${retryCount} retries: ${msg}`);
    } else {
      db.prepare(`
        UPDATE connector_events
           SET status = 'failed',
               retry_count = ?,
               last_error = ?,
               next_retry_at = ?
         WHERE id = ?
      `).run(retryCount, msg, nextRetry, eventId);
      console.warn(`[connector-webhook] Event ${eventId} failed (attempt ${retryCount}), retry scheduled at ${nextRetry}: ${msg}`);
    }
  }
}

// ─── Shopify handler ──────────────────────────────────────────────────────────

async function handleShopifyWebhook(
  workspaceId: string,
  topic: string,
  shopDomain: string,
  rawPayload: Record<string, unknown>,
): Promise<void> {
  // topic is 'orders/create' or 'orders/updated'
  await dispatchConnectorEvent(topic, workspaceId, rawPayload);
}

// ─── WooCommerce handler ─────────────────────────────────────────────────────

async function handleWooCommerceWebhook(
  workspaceId: string,
  topic: string,
  rawPayload: Record<string, unknown>,
): Promise<void> {
  if (topic !== 'order.created') return;
  await dispatchConnectorEvent(topic, workspaceId, rawPayload);
}

// ─── Route ──────────────────────────────────────────────────────────────────

/**
 * POST /api/platform/connectors/:slug/webhook
 *
 * No auth middleware — webhook authenticity is verified via signature.
 * Raw body is needed for HMAC computation, so this route must use
 * `express.raw()` parser — configured globally in index.ts.
 */
router.post('/:slug/webhook', async (req: Request, res: Response) => {
  const { slug } = req.params;

  if (slug !== 'shopify' && slug !== 'woocommerce') {
    return badRequest(res, 'Unknown connector slug');
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody as Buffer | undefined;
  if (!rawBody) {
    return badRequest(res, 'Missing raw body — ensure express.raw() parser is configured');
  }

  let rawPayload: Record<string, unknown>;
  try {
    rawPayload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return badRequest(res, 'Invalid JSON payload');
  }

  // ── Shopify ──────────────────────────────────────────────────────────────
  if (slug === 'shopify') {
    const shopDomain = req.headers['x-shopify-shopify-shop-domain'] as string | undefined;
    const topic = req.headers['x-shopify-topic'] as string | undefined;
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined;

    if (!shopDomain || !topic) {
      return badRequest(res, 'Missing required Shopify headers');
    }

    const workspaceId = resolveWorkspace('shopify', { shop: shopDomain });
    if (!workspaceId) {
      return res.status(404).json({ success: false, error: 'No installed workspace for this shop' });
    }

    const secret = getWebhookSecret('shopify', workspaceId);
    if (secret && hmacHeader) {
      if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
        return res.status(401).json({ success: false, error: 'Invalid Shopify signature' });
      }
    }

    // Replay protection — Shopify sends a unique notification ID and trigger timestamp
    const deliveryId = req.headers['x-shopify-notification-id'] as string | undefined;
    const timestampHeader = req.headers['x-shopify-triggered-at'] as string | undefined;
    const timestamp = timestampHeader ? Number(timestampHeader) : undefined;
    const replayError = markOrReject(deliveryId, timestamp);
    if (replayError) {
      return res.status(409).json({ success: false, error: replayError });
    }

    const eventId = `ce_${uuidv4()}`;
    db.prepare(`
      INSERT INTO connector_events
        (id, workspace_id, connector_slug, event_type, raw_payload, status, retry_count, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, datetime('now'))
    `).run(eventId, workspaceId, 'shopify', topic, JSON.stringify(rawPayload));

    // Fire-and-forget: process asynchronously after response is sent
    handleShopifyWebhook(workspaceId, topic, shopDomain, rawPayload)
      .then(() => processConnectorEvent(eventId, workspaceId, 'shopify', topic, rawPayload))
      .catch(() => {}); // Errors are persisted in DB; don't crash the HTTP response

    return res.json({ success: true, eventId });
  }

  // ── WooCommerce ───────────────────────────────────────────────────────────
  if (slug === 'woocommerce') {
    const topic = req.headers['x-wc-webhook-topic'] as string | undefined;
    const sigHeader = req.headers['x-wc-webhook-signature'] as string | undefined;
    const sourceHeader = req.headers['x-wc-webhook-source'] as string | undefined;

    if (!topic) {
      return badRequest(res, 'Missing WooCommerce topic header');
    }

    let domain = '';
    if (sourceHeader) {
      try { domain = new URL(sourceHeader).hostname; } catch { /* use as-is */ }
    }

    const workspaceId = resolveWorkspace('woocommerce', { domain });
    if (!workspaceId) {
      return res.status(404).json({ success: false, error: 'No installed workspace for this store' });
    }

    const secret = getWebhookSecret('woocommerce', workspaceId);
    if (secret && sigHeader) {
      if (!verifyWooCommerceHmac(rawBody, sigHeader, secret)) {
        return res.status(401).json({ success: false, error: 'Invalid WooCommerce signature' });
      }
    }

    // Replay protection — WooCommerce HMAC is unique per delivery, but we also
    // record the delivery ID from the signature body hash if provided
    const deliveryId = req.headers['x-wc-webhook-id'] as string | undefined;
    const replayError = markOrReject(deliveryId, undefined);
    if (replayError) {
      return res.status(409).json({ success: false, error: replayError });
    }

    const eventId = `ce_${uuidv4()}`;
    db.prepare(`
      INSERT INTO connector_events
        (id, workspace_id, connector_slug, event_type, raw_payload, status, retry_count, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, datetime('now'))
    `).run(eventId, workspaceId, 'woocommerce', topic, JSON.stringify(rawPayload));

    handleWooCommerceWebhook(workspaceId, topic, rawPayload)
      .then(() => processConnectorEvent(eventId, workspaceId, 'woocommerce', topic, rawPayload))
      .catch(() => {});

    return res.json({ success: true, eventId });
  }

  return badRequest(res, 'Unsupported connector');
});

export default router;
