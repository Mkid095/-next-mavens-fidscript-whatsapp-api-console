/**
 * replayProtection.ts — Replay attack prevention for inbound webhooks.
 *
 * Webhooks sent by FIDScript SDKs include:
 *   X-FidScript-Delivery-ID        — unique per delivery attempt
 *   X-FidScript-Delivery-Timestamp  — Unix epoch seconds when the SDK sent it
 *
 * Connectors (Shopify/WooCommerce) use their own ID/timestamp headers:
 *   Shopify: X-Shopify-Triggered-At, X-Shopify-Notification_Id
 *   WooCommerce: X-Wc-Webhook-Signature ( HMAC already unique per payload)
 *
 * This module provides:
 *   1. isReplay(deliveryId)   — returns true if this ID was already seen
 *   2. markDelivered(id)      — record a new delivery ID
 *   3. isStale(timestamp)     — reject webhooks older than MAX_AGE_SECONDS
 */

import db from '../../database.js';

const MAX_AGE_SECONDS = 5 * 60; // 5 minutes —，超过这个时间戳就拒绝

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if this delivery ID has already been processed.
 * Call BEFORE marking it delivered.
 */
export function isReplay(deliveryId: string): boolean {
  const row = db.prepare(
    `SELECT delivery_id FROM webhook_delivery_ids WHERE delivery_id = ?`,
  ).get(deliveryId);
  return row !== undefined;
}

/**
 * Record that we've received this delivery ID.
 * Safe to call multiple times (upsert).
 */
export function markDelivered(deliveryId: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO webhook_delivery_ids (delivery_id, received_at)
    VALUES (?, datetime('now'))
  `).run(deliveryId);
}

/**
 * Returns true if the Unix-epoch timestamp is older than MAX_AGE_SECONDS.
 */
export function isStale(timestamp: number): boolean {
  const now = Date.now() / 1000;
  return now - timestamp > MAX_AGE_SECONDS;
}

/**
 * Reject result shape for markDelivered — returns error message or null.
 * Call markOrReject within the request handler.
 */
export function markOrReject(
  deliveryId: string | undefined,
  timestamp: number | undefined,
): string | null {
  if (!deliveryId) return null; // header not present — skip (auth relies on HMAC)

  if (isReplay(deliveryId)) {
    return `Duplicate delivery ID '${deliveryId}' — possible replay attack`;
  }

  if (timestamp !== undefined && isStale(timestamp)) {
    return `Webhook timestamp is stale (${MAX_AGE_SECONDS}s max age)`;
  }

  markDelivered(deliveryId);
  return null;
}
