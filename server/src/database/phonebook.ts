// Phonebook sync support — adds an `instance_id` column to `contacts` so the
// WhatsApp-synced phonebook is stored alongside manual contacts in the same
// table (bulk messaging picks them up naturally).
//
//   instance_id IS NULL     → manually saved contact (persists on disconnect)
//   instance_id IS NOT NULL → synced from WhatsApp (deleted on disconnect)

import type { Database } from 'sql.js';

export function runPhonebookMigrations(db: Database): void {
  try { db.run('ALTER TABLE contacts ADD COLUMN instance_id TEXT'); } catch { /* already exists */ }
  db.run('CREATE INDEX IF NOT EXISTS idx_contacts_instance_id ON contacts(instance_id)');
}