import type { Database } from 'sql.js';

// Indexes on tables + columns that exist at createSchema() time (tables.ts).
// Platform-module indexes (workspace_members, conversations, domain_events,
// customers, search_index, audit_logs.workspace_id, …) live in
// modules/platform/workspace/migrations.ts, because those tables/columns are
// created AFTER createSchema() — creating their indexes here would crash a
// fresh database on boot.
export function createIndexes(db: Database): void {
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_client ON instances(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_timestamp ON inbox_messages(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_token_transactions_client ON token_transactions(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payhero_reference)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email, created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON idempotency_keys(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at)`);

  // inbox_messages columns (conversation_id/customer_id/workspace_id) are added
  // in tables.ts before createIndexes(), so these are safe here.
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_conv ON inbox_messages(conversation_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_customer ON inbox_messages(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_ws ON inbox_messages(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_chat ON inbox_messages(chat_id, timestamp)`);
}
