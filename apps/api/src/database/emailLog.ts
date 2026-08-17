// Centralized email-send audit log - every send (success or failure) is
// recorded so delivery issues are visible in the UI/API rather than silent.
import type { Database } from 'sql.js';

export function runEmailLogMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS email_send_log (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT,
      template TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT,
      status TEXT NOT NULL,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_email_log_to ON email_send_log(to_email)');
  db.run('CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_send_log(created_at)');
}