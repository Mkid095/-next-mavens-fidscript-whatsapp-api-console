/**
 * conversationUpdateHelpers.ts — DB queries for conversation management.
 */
import db from '../../database.js';

export function wsId(req: { client?: { id: string } }): string {
  return req.client?.id ?? '';
}

export function getConversation(conversationId: string, workspaceId: string) {
  return db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?')
    .get(conversationId, workspaceId) as { id: string } | undefined;
}

export function getActiveAssignment(conversationId: string) {
  return db.prepare(`
    SELECT id, user_id, team_id FROM conversation_assignments
    WHERE conversation_id = ? AND status = 'active' LIMIT 1
  `).get(conversationId) as { id: string; user_id: string | null; team_id: string | null } | undefined;
}

export function getUserName(userId: string): string {
  return (db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined)?.name ?? userId;
}

export function checkWorkspaceMembership(workspaceId: string, userId: string): boolean {
  return !!db.prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
    .get(workspaceId, userId);
}

export function insertAssignment(opts: {
  conversationId: string; userId?: string | null; teamId?: string | null;
  actorUserId: string; assigneeType: 'user' | 'team'; notes?: string | null;
}): string {
  const id = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`
    INSERT INTO conversation_assignments
      (id, conversation_id, user_id, team_id, assigned_by, assignee_type, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(id, opts.conversationId, opts.userId ?? null, opts.teamId ?? null, opts.actorUserId, opts.assigneeType, opts.notes ?? null);
  return id;
}

export function releaseAssignment(assignmentId: string): void {
  db.prepare(`UPDATE conversation_assignments SET status='released', released_at=datetime('now') WHERE id=?`)
    .run(assignmentId);
}

export function transferAssignment(conversationId: string): void {
  const current = getActiveAssignment(conversationId);
  if (current) {
    db.prepare(`UPDATE conversation_assignments SET status='transferred', released_at=datetime('now') WHERE id=?`)
      .run(current.id);
  }
}
