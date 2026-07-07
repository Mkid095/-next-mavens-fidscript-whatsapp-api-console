/**
 * phase35.ts — Connector webhook events table.
 *
 * Stores every incoming webhook event from connector integrations (Shopify,
 * WooCommerce, etc.) before it is processed and emitted to the event bus.
 * Allows replay, debugging, and idempotency checks.
 */
import type { Database } from 'sql.js';

export function runPhase35Migrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS connector_events (
      id              TEXT PRIMARY KEY,
      workspace_id    TEXT NOT NULL,
      connector_slug  TEXT NOT NULL,
      event_type      TEXT NOT NULL,
      raw_payload     TEXT NOT NULL,
      processed_at    TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_conn_ev_ws_type
      ON connector_events(workspace_id, event_type)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_conn_ev_created
      ON connector_events(created_at)
  `);
}
