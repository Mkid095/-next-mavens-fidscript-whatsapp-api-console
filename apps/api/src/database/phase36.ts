/**
 * phase36.ts — Connector event retry / dead-letter support.
 *
 * Adds retry metadata to connector_events so failed events can be
 * retried with exponential backoff instead of being silently dropped.
 *
 * Columns added:
 *   status        TEXT    — 'pending' | 'processing' | 'completed' | 'failed'
 *   retry_count  INTEGER — number of retry attempts made (default 0)
 *   last_error   TEXT    — error message from last failed attempt
 *   next_retry_at TEXT    — ISO timestamp for next retry (NULL if not scheduled)
 */
import type { Database } from 'sql.js';

// Helper: add a column only if it doesn't already exist (idempotent)
function addColumnIfNotExists(db: Database, table: string, colDef: string): void {
  try {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
  } catch (e: unknown) {
    // Already exists — skip silently
  }
}

export function runPhase36Migrations(db: Database): void {
  // Status: tracks event lifecycle
  addColumnIfNotExists(db, 'connector_events', "status TEXT NOT NULL DEFAULT 'pending'");

  // How many times we've tried and failed
  addColumnIfNotExists(db, 'connector_events', 'retry_count INTEGER NOT NULL DEFAULT 0');

  // Human-readable error from last failure
  addColumnIfNotExists(db, 'connector_events', 'last_error TEXT');

  // When to next retry (NULL = not scheduled / permanent failure)
  addColumnIfNotExists(db, 'connector_events', 'next_retry_at TEXT');

  // Backfill existing rows as 'completed' (they already have processed_at set)
  db.run(`
    UPDATE connector_events
       SET status = CASE
         WHEN processed_at IS NOT NULL THEN 'completed'
         ELSE 'pending'
       END
  `);

  // Index for the retry picker query
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_conn_ev_status_next
      ON connector_events(status, next_retry_at)
      WHERE status = 'failed'
  `);
}
