/**
 * Conversation route handlers.
 */
import type { Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import {
  dispatchConversationAssigned,
  dispatchConversationPriorityChanged,
  dispatchConversationStatusChanged,
} from '../../modules/platform/events/index.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import db from '../../database.js';

function wsId(req: Request): string {
  return req.client!.id;
}

function buildCtx(req: Request) {
  const workspaceId = wsId(req);
  return { workspaceId, actorUserId: workspaceId, roleId: 'role_0', perms: ['*'] };
}

function insertTimelineMessage(conversationId: string, content: string, workspaceId: string): void {
  db.prepare(`INSERT INTO inbox_messages (id, conversation_id, workspace_id, from_number, from_name, message_type, content, direction, is_read, timestamp, is_system) VALUES (?, ?, ?, '', ?, 'text', ?, 'system', 1, ?, 1)`)
    .run(`sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, conversationId, workspaceId, content, new Date().toISOString());
}

function resolveInstanceName(workspaceId: string): string | null {
  const row = db.prepare('SELECT name FROM instances WHERE client_id = ? LIMIT 1').get(workspaceId) as { name: string } | undefined;
  return row?.name ?? null;
}

function errRes(res: Response, err: unknown): void {
  res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
}

export function handleListConversations(req: Request, res: Response): void {
  try {
    const { status, assignee, priority, sla_at_risk } = req.query;
    const q = (req.query.q as string | undefined)?.trim();
    let sql = `SELECT conv.id, conv.customer_id, conv.channel, conv.instance_id, conv.chat_id, conv.status, conv.priority, conv.assignee_type, conv.assignee_id, conv.team_id, conv.unread_count, conv.last_message_at, conv.ai_state, conv.response_due_at, conv.resolution_due_at, conv.breached_at, conv.created_at, c.display_name as customer_name, (SELECT content FROM inbox_messages WHERE conversation_id = conv.id ORDER BY timestamp DESC LIMIT 1) as last_message, (SELECT message_type FROM inbox_messages WHERE conversation_id = conv.id ORDER BY timestamp DESC LIMIT 1) as last_message_type FROM conversations conv LEFT JOIN customers c ON c.id = conv.customer_id WHERE conv.workspace_id = ?`;
    const params: unknown[] = [wsId(req)];
    if (status) { sql += ' AND conv.status = ?'; params.push(status); }
    if (priority) { sql += ' AND conv.priority = ?'; params.push(priority); }
    if (assignee === 'me') {
      const userId = (req as any).workspace?.userId;
      if (userId) { sql += ' AND conv.assignee_type = ? AND conv.assignee_id = ?'; params.push('user', userId); }
    } else if (assignee === 'unassigned') { sql += ' AND conv.assignee_type = ?'; params.push('unassigned'); }
    else if (assignee === 'team') { sql += " AND conv.assignee_type = ? AND conv.assignee_id IS NOT NULL"; params.push('team'); }
    if (sla_at_risk === '1' || sla_at_risk === 'true') {
      sql += ` AND conv.status NOT IN ('resolved', 'closed') AND conv.response_due_at IS NOT NULL AND (conv.breached_at IS NOT NULL OR (conv.first_response_at IS NULL AND conv.response_due_at <= datetime('now', '+1 hour')))`;
    }
    if (q) { sql += ' AND (c.display_name LIKE ? OR conv.chat_id LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    sql += ' ORDER BY conv.last_message_at DESC NULLS LAST LIMIT 200';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) { errRes(res, err); }
}

export function handleGetMessages(req: Request, res: Response): void {
  try {
    const owned = db.prepare('SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const messages = db.prepare(`SELECT im.id, im.from_number, im.from_name, im.message_type, im.content, im.media_url, im.is_read, im.timestamp, im.direction, im.customer_id, im.conversation_id FROM inbox_messages im WHERE im.conversation_id = ? ORDER BY im.timestamp ASC LIMIT 500`).all(req.params.id) as Record<string, unknown>[];
    const formatted = messages.map(m => ({ id: m.id, fromNumber: m.from_number, fromName: m.from_name, messageType: m.message_type, content: m.content, mediaUrl: m.media_url, isRead: m.is_read, timestamp: m.timestamp, direction: m.direction, customerId: m.customer_id, conversationId: m.conversation_id }));
    res.json({ success: true, data: formatted });
  } catch (err) { errRes(res, err); }
}

export function handlePatchConversation(req: Request, res: Response): void {
  try {
    const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req)) as Record<string, unknown> | undefined;
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const ctx = buildCtx(req);
    const { status, priority, assignee_type, assignee_id } = req.body as Record<string, unknown>;
    const updates: string[] = []; const params: unknown[] = [];
    if (status && status !== conv.status) { updates.push('status = ?'); params.push(status); dispatchConversationStatusChanged(ctx, { conversationId: req.params.id, status: status as 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed', byUserId: wsId(req) }).catch(() => {}); }
    if (priority && priority !== conv.priority) { updates.push('priority = ?'); params.push(priority); dispatchConversationPriorityChanged(ctx, { conversationId: req.params.id, priority: priority as 'urgent' | 'high' | 'medium' | 'low', byUserId: wsId(req) }).catch(() => {}); }
    if (assignee_type) { updates.push('assignee_type = ?', 'assignee_id = ?'); params.push(assignee_type, assignee_id ?? null); dispatchConversationAssigned(ctx, { conversationId: req.params.id, assigneeType: assignee_type as 'user' | 'team' | 'unassigned', assigneeId: assignee_id as string | null, byUserId: wsId(req) }).catch(() => {}); }
    if (updates.length) { params.push(req.params.id); db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...params); logAuditAction(req, 'CONVERSATION_UPDATED', 'conversation', req.params.id, JSON.stringify(req.body)); }
    res.json({ success: true });
  } catch (err) { errRes(res, err); }
}

export function handleAssignConversation(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const { userId, teamId, notes } = req.body as Record<string, unknown>;
    const authReq = req as any;
    const actorUserId = authReq.workspace?.userId ?? workspaceId;
    if (!userId && !teamId) { res.status(400).json({ success: false, error: 'userId or teamId is required' }); return; }
    if (userId && teamId) { res.status(400).json({ success: false, error: 'provide only userId OR teamId, not both' }); return; }
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?').get(conversationId, workspaceId) as { id: string } | undefined;
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    if (userId) { const member = db.prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?').get(workspaceId, userId as string); if (!member) { res.status(400).json({ success: false, error: 'User is not a member of this workspace' }); return; } }
    const assigneeType = userId ? 'user' : 'team';
    const assigneeId = (userId ?? teamId) as string;
    const id = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO conversation_assignments (id, conversation_id, user_id, team_id, assigned_by, assignee_type, status, notes) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`).run(id, conversationId, userId ?? null, teamId ?? null, actorUserId, assigneeType, notes ?? null);
    db.prepare(`UPDATE conversations SET assignee_type = ?, assignee_id = ?, team_id = ?, active_agent_id = ?, status = 'assigned' WHERE id = ?`).run(assigneeType, userId ?? null, teamId ?? null, userId ?? null, conversationId);
    let assigneeName = assigneeId;
    if (userId) { const u = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined; assigneeName = u?.name ?? assigneeId; }
    insertTimelineMessage(conversationId, `Conversation assigned to ${assigneeName}`, workspaceId);
    emitDashboardRefresh(workspaceId);
    dispatchConversationAssigned({ workspaceId, actorUserId, roleId: authReq.workspace?.roleId ?? 'role_0', perms: authReq.workspace?.perms ?? ['*'] }, { conversationId, assigneeType, assigneeId, byUserId: actorUserId }).catch(() => {});
    logAuditAction(req, 'ASSIGN', 'conversation', conversationId, `Assigned to ${assigneeName}`);
    res.json({ success: true, message: `Assigned to ${assigneeName}` });
  } catch (err) { errRes(res, err); }
}

export function handleTransferConversation(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const { userId, teamId, notes } = req.body as Record<string, unknown>;
    const authReq = req as any;
    const actorUserId = authReq.workspace?.userId ?? workspaceId;
    if (!userId && !teamId) { res.status(400).json({ success: false, error: 'userId or teamId is required' }); return; }
    if (userId && teamId) { res.status(400).json({ success: false, error: 'provide only userId OR teamId, not both' }); return; }
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?').get(conversationId, workspaceId) as { id: string } | undefined;
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    if (userId) { const member = db.prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?').get(workspaceId, userId as string); if (!member) { res.status(400).json({ success: false, error: 'User is not a member of this workspace' }); return; } }
    const current = db.prepare(`SELECT id, user_id, team_id FROM conversation_assignments WHERE conversation_id = ? AND status = 'active' LIMIT 1`).get(conversationId) as { id: string; user_id: string | null; team_id: string | null } | undefined;
    let fromName = 'unknown';
    if (current?.user_id) { const u = db.prepare('SELECT name FROM users WHERE id = ?').get(current.user_id) as { name: string } | undefined; fromName = u?.name ?? current.user_id; }
    else if (current?.team_id) fromName = current.team_id;
    if (current) db.prepare(`UPDATE conversation_assignments SET status='transferred', released_at=datetime('now') WHERE id=?`).run(current.id);
    const newId = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const assigneeType = userId ? 'user' : 'team';
    const assigneeId = (userId ?? teamId) as string;
    db.prepare(`INSERT INTO conversation_assignments (id, conversation_id, user_id, team_id, assigned_by, assignee_type, status, notes) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`).run(newId, conversationId, userId ?? null, teamId ?? null, actorUserId, assigneeType, notes ?? null);
    db.prepare(`UPDATE conversations SET assignee_type=?, assignee_id=?, team_id=?, active_agent_id=?, status='assigned' WHERE id=?`).run(assigneeType, userId ?? null, teamId ?? null, userId ?? null, conversationId);
    let toName = assigneeId;
    if (userId) { const u = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined; toName = u?.name ?? assigneeId; }
    insertTimelineMessage(conversationId, `Conversation transferred from ${fromName} to ${toName}`, workspaceId);
    emitDashboardRefresh(workspaceId);
    dispatchConversationAssigned({ workspaceId, actorUserId, roleId: authReq.workspace?.roleId ?? 'role_0', perms: authReq.workspace?.perms ?? ['*'] }, { conversationId, assigneeType, assigneeId, byUserId: actorUserId }).catch(() => {});
    logAuditAction(req, 'TRANSFER', 'conversation', conversationId, `Transferred from ${fromName} to ${toName}`);
    res.json({ success: true, message: `Transferred from ${fromName} to ${toName}` });
  } catch (err) { errRes(res, err); }
}

export function handleReleaseConversation(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const authReq = req as any;
    const actorUserId = authReq.workspace?.userId ?? workspaceId;
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?').get(conversationId, workspaceId) as { id: string } | undefined;
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const current = db.prepare(`SELECT id, user_id, team_id FROM conversation_assignments WHERE conversation_id = ? AND status = 'active' LIMIT 1`).get(conversationId) as { id: string; user_id: string | null; team_id: string | null } | undefined;
    let releasedBy = actorUserId;
    if (current?.user_id) { const u = db.prepare('SELECT name FROM users WHERE id = ?').get(current.user_id) as { name: string } | undefined; releasedBy = u?.name ?? actorUserId; }
    else if (current?.team_id) releasedBy = current.team_id;
    if (current) db.prepare(`UPDATE conversation_assignments SET status='released', released_at=datetime('now') WHERE id=?`).run(current.id);
    db.prepare(`UPDATE conversations SET assignee_type='unassigned', assignee_id=null, team_id=null, active_agent_id=null, status='resolved' WHERE id=?`).run(conversationId);
    insertTimelineMessage(conversationId, `Conversation released by ${releasedBy}`, workspaceId);
    emitDashboardRefresh(workspaceId);
    dispatchConversationAssigned({ workspaceId, actorUserId, roleId: authReq.workspace?.roleId ?? 'role_0', perms: authReq.workspace?.perms ?? ['*'] }, { conversationId, assigneeType: 'unassigned', assigneeId: null, byUserId: actorUserId }).catch(() => {});
    logAuditAction(req, 'RELEASE', 'conversation', conversationId, 'Conversation released');
    res.json({ success: true, message: 'Conversation released' });
  } catch (err) { errRes(res, err); }
}

