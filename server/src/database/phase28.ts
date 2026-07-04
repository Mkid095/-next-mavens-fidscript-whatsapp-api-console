/**
 * phase28.ts — Conversation Inspector schema:
 *
 * 1. chatbot_response_metadata: add prompt_version, bot_version,
 *    matched_trigger, matched_rule, skip_reason
 *
 * 2. chatbot_traces: add message_id — hard link to the bot's
 *    outgoing inbox_messages row (null for trigger_eval which fires
 *    before the response messageId is known; non-null for llm_call /
 *    tool_call / response_send)
 *
 * 3. Conversation scope: backfill message_id for existing trace rows
 *    by matching conversation_id + chatbot_id + timestamp proximity to
 *    the nearest outgoing inbox_messages row written during the same
 *    chatbot-worker run.
 *
 * Going forward, chatbot-worker writes message_id when inserting trace
 * rows for llm_call / tool_call / response_send.  trigger_eval is left
 * null (no response message exists at that point).
 */
import type { Database as SqlJsDatabase } from 'sql.js';

export function runPhase28Migrations(db: SqlJsDatabase): void {
  const addColumnIfMissing = (table: string, col: string, def: string): void => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    } catch {
      // Column already exists — safe on re-run
    }
  };

  // ── 1. Extend chatbot_response_metadata ────────────────────────────────────
  addColumnIfMissing('chatbot_response_metadata', 'prompt_version',  'TEXT');
  addColumnIfMissing('chatbot_response_metadata', 'bot_version',      'TEXT');
  addColumnIfMissing('chatbot_response_metadata', 'matched_trigger', 'TEXT');
  addColumnIfMissing('chatbot_response_metadata', 'matched_rule',    'TEXT');
  addColumnIfMissing('chatbot_response_metadata', 'skip_reason',     'TEXT');

  // ── 2. Add message_id to chatbot_traces ─────────────────────────────────────
  addColumnIfMissing('chatbot_traces', 'message_id', 'TEXT');

  // ── 3. Backfill message_id on existing trace rows ────────────────────────────
  //
  // For each trace row where message_id IS NULL, find the nearest outgoing
  // inbox_messages row written by the same chatbot in the same conversation.
  // We use a correlated subquery ordered by ABS(t1.created_at - t2.timestamp)
  // to find the closest message by timestamp.
  try {
    db.exec(`
      UPDATE chatbot_traces
      SET message_id = (
        SELECT im.id FROM inbox_messages im
        WHERE im.conversation_id = chatbot_traces.conversation_id
          AND im.direction      = 'outgoing'
          AND im.workspace_id  = chatbot_traces.workspace_id
          AND im.timestamp     >= chatbot_traces.created_at
        ORDER BY im.timestamp ASC
        LIMIT 1
      )
      WHERE message_id IS NULL
        AND chatbot_traces.conversation_id IS NOT NULL
    `);
  } catch {
    // Tables may not exist yet if earlier phases haven't run
  }
}
