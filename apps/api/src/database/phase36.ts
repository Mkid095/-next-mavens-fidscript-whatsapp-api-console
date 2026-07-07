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

export function runPhase36Migrations(db: Database): void {
  // Status: tracks event lifecycle
  db.run(`
    ALTER TABLE connector_events
      ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  `);

  // How many times we've tried and failed
  db.run(`
    ALTER TABLE connector_events
      ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0
  `);

  // Human-readable error from last failure
  db.run(`
    ALTER TABLE connector_events
      ADD COLUMN last_error TEXT
  `);

  // When to next retry (NULL = not scheduled / permanent failure)
  db.run(`
    ALTER TABLE connector_events
      ADD COLUMN next_retry_at TEXT
  `);

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
