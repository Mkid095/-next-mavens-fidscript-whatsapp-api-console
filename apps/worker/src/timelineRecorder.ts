/**
 * Timeline Recorder — inserts a system timeline message into inbox_messages
 * (used when AI resumes after a manual override, when an override expires, etc.)
 */

import db from '../database.js';

export function insertTimelineMessage(conversationId: string, content: string, workspaceId: string): void {
  db.prepare(`INSERT INTO inbox_messages
    (id, conversation_id, workspace_id, from_number, from_name, message_type, content, direction, is_read, timestamp, is_system)
    VALUES (?, ?, ?, '', ?, 'text', ?, 'system', 1, ?, 1)`
  ).run(
    `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId, workspaceId, content, new Date().toISOString(),
  );
}
