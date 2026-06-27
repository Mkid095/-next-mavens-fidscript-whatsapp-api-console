/**
 * Phase 8: Group sync support tables
 * - cached_group_info: stores group subject/size to avoid repeated API calls
 * - cached_participants: maps group JID + phone → contact name for sender attribution
 */
import type { Database } from 'sql.js';

export function runPhase8Migrations(db: Database): void {
  try { db.run(`CREATE TABLE IF NOT EXISTS cached_group_info (
    group_jid TEXT PRIMARY KEY,
    subject TEXT,
    size INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS cached_participants (
    group_jid TEXT,
    phone TEXT,
    contact_id TEXT,
    display_name TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_jid, phone)
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_cached_participants_group ON cached_participants(group_jid)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_cached_participants_phone ON cached_participants(phone)`); } catch (_) { /* ok */ }
}
