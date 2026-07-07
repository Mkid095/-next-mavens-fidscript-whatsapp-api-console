/**
 * phase33.ts — Connector credentials table.
 *
 * Stores encrypted OAuth access tokens / API keys for workspace-level
 * third-party integrations (Shopify, WooCommerce, etc.).
 */
import type { Database } from 'sql.js';

export function runPhase33Migrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS connector_credentials (
      id              TEXT PRIMARY KEY,
      connector_id    TEXT NOT NULL,
      workspace_id    TEXT NOT NULL,
      encrypted_token TEXT NOT NULL,
      iv              TEXT NOT NULL,
      auth_tag        TEXT NOT NULL,
      expires_at      TEXT,
      extra_json      TEXT,
      revoked_at      TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(connector_id, workspace_id)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_conn_cred_ws
      ON connector_credentials(workspace_id, revoked_at)
  `);
}
