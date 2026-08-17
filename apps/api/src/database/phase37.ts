/**
 * phase37.ts - Webhook delivery ID dedup table.
 *
 * Stores inbound delivery IDs with timestamps so we can reject replayed
 * webhooks. Outbound fan-out delivery tracking lives in webhook_deliveries;
 * this table is only for inbound replay protection.
 *
 * Table: webhook_delivery_ids
 *   delivery_id  TEXT PRIMARY KEY  - unique per delivery (from X-FidScript-Delivery-ID)
 *   received_at  TEXT              - ISO timestamp when we first saw this ID
 *
 * TTL: rows older than 24 hours are cleaned up on each boot (webhooks are
 * not replayed days later; 5-minute age validation rejects stale fresh deliveries).
 */
import type { Database } from 'sql.js';

export function runPhase37Migrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS webhook_delivery_ids (
      delivery_id  TEXT PRIMARY KEY,
      received_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Prune old entries on every boot - prevents unbounded table growth
  db.run(`
    DELETE FROM webhook_delivery_ids
     WHERE received_at < datetime('now', '-24 hours')
  `);
}
