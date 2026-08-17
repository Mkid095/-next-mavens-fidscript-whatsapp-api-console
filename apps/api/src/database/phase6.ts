import type { Database } from 'sql.js';

// =============================================================================
// Phase 6 migrations - Developer ecosystem (§14).
//   - webhooks: outbound endpoint registration per workspace
//   - webhook_deliveries: attempt log for each event fan-out
//   - api_logs: enrich with latency_ms + workspace_id (was a §14.2 requirement)
// All guarded by ALTER / CREATE TABLE IF NOT EXISTS - sql.js boot order safe.
// =============================================================================

export function runPhase6Migrations(db: Database): void {
  // -------------------------------------------------------------------
  // webhooks - businesses register a URL + event filter; we POST signed
  // payloads on every matching domain event.
  // secret is a per-webhook HMAC secret used to sign the body in the
  // X-FIDScript-Signature header (HMAC-SHA256 hex).
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      secret TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_delivery_at TEXT
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_webhooks_workspace ON webhooks(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(workspace_id, status)`);

  // -------------------------------------------------------------------
  // webhook_deliveries - one row per delivery attempt.
  // response_code = HTTP status from the consumer (0 if connection failed).
  // attempt = 1..N (we retry on 5xx and network errors up to 5 times).
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      event_id TEXT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      response_code INTEGER DEFAULT 0,
      response_body TEXT,
      attempt INTEGER DEFAULT 1,
      delivered_at TEXT,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC)`);

  // -------------------------------------------------------------------
  // api_logs enrichment (§14.2) - latency_ms + workspace_id.
  // The existing writer at modules/platform/audit/writer.ts writes the
  // current schema; we add the columns now and adopt them in a follow-up.
  // -------------------------------------------------------------------
  try { db.run('ALTER TABLE api_logs ADD COLUMN latency_ms INTEGER'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE api_logs ADD COLUMN workspace_id TEXT'); } catch (_) { /* ok */ }
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_workspace ON api_logs(workspace_id, timestamp DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_latency ON api_logs(workspace_id, latency_ms)`);

  // -------------------------------------------------------------------
  // FTS5 virtual table for search_index (§8.1) - fixes the silent LIKE
  // fallback. The base search_index table is created in workspace/migrations.ts
  // (run before phase6). We mirror its rows into search_index_fts via
  // triggers so the FTS5 index stays in sync with inserts/updates/deletes.
  //
  // Uses content='search_index' (external content FTS5) so we don't
  // duplicate storage; rowid is mapped to search_index.rowid.
  //
  // CREATE VIRTUAL TABLE is not IF-NOT-EXISTS-able in sql.js the way
  // regular tables are, so we guard with a SELECT count(*).
  // -------------------------------------------------------------------
  try {
    const ftsExists = (() => {
      const stmt = db.prepare(`SELECT count(*) as n FROM sqlite_master WHERE type='table' AND name='search_index_fts'`);
      stmt.bind([]);
      const n = stmt.step() ? (stmt.getAsObject() as { n: number }).n : 0;
      stmt.free();
      return n;
    })();
    if (ftsExists === 0) {
      db.run(`
        CREATE VIRTUAL TABLE search_index_fts USING fts5(
          body,
          content='search_index',
          content_rowid='rowid',
          tokenize='porter unicode61'
        )
      `);

      // Initial backfill - copy every existing search_index row into the FTS index.
      db.run(`
        INSERT INTO search_index_fts(rowid, body)
          SELECT rowid, body FROM search_index WHERE body IS NOT NULL
      `);

      // Triggers: keep FTS in sync. AFTER triggers so we never index half-written rows.
      db.run(`
        CREATE TRIGGER IF NOT EXISTS search_index_ai AFTER INSERT ON search_index BEGIN
          INSERT INTO search_index_fts(rowid, body) VALUES (new.rowid, new.body);
        END
      `);
      db.run(`
        CREATE TRIGGER IF NOT EXISTS search_index_ad AFTER DELETE ON search_index BEGIN
          INSERT INTO search_index_fts(search_index_fts, rowid, body) VALUES('delete', old.rowid, old.body);
        END
      `);
      db.run(`
        CREATE TRIGGER IF NOT EXISTS search_index_au AFTER UPDATE ON search_index BEGIN
          INSERT INTO search_index_fts(search_index_fts, rowid, body) VALUES('delete', old.rowid, old.body);
          INSERT INTO search_index_fts(rowid, body) VALUES (new.rowid, new.body);
        END
      `);
    }
  } catch (e) {
    // FTS5 not available in this sql.js build - provider.ts has a LIKE fallback.
    console.warn('[phase6] FTS5 init failed; falling back to LIKE:', e instanceof Error ? e.message : String(e));
  }
}
