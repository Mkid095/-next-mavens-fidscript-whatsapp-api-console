import type { Database } from 'sql.js';

export function createIndexes(db: Database): void {
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_client ON instances(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_timestamp ON inbox_messages(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_token_transactions_client ON token_transactions(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payhero_reference)`);
}
