/**
 * Phase 20 — Production-grade human handoff
 *
 * 1. chatbot_conversation_overrides:
 *    - expires_at     TEXT        — when to auto-resume AI (ISO timestamp, null = never)
 *    - resume_policy  TEXT        — 'manual' | 'next_message' | 'timeout'
 *    - reason         TEXT        — handoff reason code
 *
 * 2. inbox_messages:
 *    - is_system INTEGER DEFAULT 0 — marks timeline/audit messages (direction='system')
 */

import type { Database } from 'sql.js';

export function runPhase20Migrations(db: Database): void {
  // 1. Override table — expiry, resume policy, reason
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN expires_at TEXT"); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN resume_policy TEXT DEFAULT 'manual'"); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN reason TEXT"); } catch (e: any) { /* already exists */ }

  // 2. System/timeline messages on inbox_messages
  try { db.run("ALTER TABLE inbox_messages ADD COLUMN is_system INTEGER DEFAULT 0"); } catch (e: any) { /* already exists */ }
}
