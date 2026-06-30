/**
 * Phase 21 — Override History & Auto-Human Takeover
 *
 * 1. chatbot_conversation_overrides:
 *    - status        TEXT DEFAULT 'active' — active | expired | completed | cancelled
 *    - ended_at      TEXT                  — when the override ended (ISO timestamp)
 *    - ended_reason  TEXT                  — reason for ending: manual_resume |
 *                   timeout_expired | next_message_completed |
 *                   system_resume | admin_cancelled
 *    - source        TEXT DEFAULT 'manual' — manual | automatic | system | api
 *
 *    Status transitions (no row deletions):
 *      active → expired    (timeout elapsed)
 *      active → completed  (next_message policy triggered)
 *      active → cancelled  (admin cancelled / manual resume)
 *
 * 2. Auto-takeover on outbound agent replies:
 *    When the worker processes an outgoing message (direction='outgoing')
 *    from an agent while AI is active, automatically insert a 'next_message'
 *    override so the AI pauses and the agent takes over for one reply.
 *
 * 3. inbox_messages:
 *    - sender_type TEXT — 'agent' | 'bot' | 'system' | 'customer'
 *      Populated on outgoing messages to track who initiated the send.
 */

import type { Database } from 'sql.js';

export function runPhase21Migrations(db: Database): void {
  // 1. Override history — status, ended_at, ended_reason, source
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN ended_at TEXT"); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN ended_reason TEXT"); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE chatbot_conversation_overrides ADD COLUMN source TEXT DEFAULT 'manual'"); } catch (e: any) { /* already exists */ }

  // 2. Sender type on inbox_messages (for auto-takeover detection)
  try { db.run("ALTER TABLE inbox_messages ADD COLUMN sender_type TEXT DEFAULT 'customer'"); } catch (e: any) { /* already exists */ }
}
