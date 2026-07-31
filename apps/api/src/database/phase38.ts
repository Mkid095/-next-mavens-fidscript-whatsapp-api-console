/**
 * Phase 38 — LID column for outbox tracking
 *
 * Adds `lid` column to inbox_messages. When a message is sent outbound,
 * `lid = 'LID'` is set so sent messages can be queried separately from
 * the incoming chat list (Contacts/Groups tabs).
 */
import type { Database } from 'sql.js';

export function runPhase38Migrations(db: Database): void {
  try { db.run("ALTER TABLE inbox_messages ADD COLUMN lid TEXT DEFAULT NULL"); } catch (e: any) { /* already exists */ }
}
