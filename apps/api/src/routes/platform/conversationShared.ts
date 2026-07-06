import { Request } from 'express';
import db from '../../database.js';

// =============================================================================
// Shared helpers (used by multiple handler groups)
// =============================================================================

export function wsId(req: Request): string {
  return req.client!.id;
}

export function buildCtx(req: Request) {
  const workspaceId = wsId(req);
  return { workspaceId, actorUserId: workspaceId, roleId: 'role_0', perms: ['*'] };
}

/** Insert a system/timeline message into the inbox for audit purposes. */
export function insertTimelineMessage(conversationId: string, content: string, workspaceId: string): void {
  db.prepare(`INSERT INTO inbox_messages
    (id, conversation_id, workspace_id, from_number, from_name, message_type, content, direction, is_read, timestamp, is_system)
    VALUES (?, ?, ?, '', ?, 'text', ?, 'system', 1, ?, 1)`
  ).run(
    `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId, workspaceId, content, new Date().toISOString(),
  );
}

/** Resolve an instance name for a workspace (client_id). Used for SSE emission. */
export function resolveInstanceName(workspaceId: string): string | null {
  const row = db.prepare(
    'SELECT name FROM instances WHERE client_id = ? LIMIT 1'
  ).get(workspaceId) as { name: string } | undefined;
  return row?.name ?? null;
}
