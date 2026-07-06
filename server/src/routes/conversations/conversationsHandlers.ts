/**
 * Conversation route handlers.
 */
import type { Request, Response } from 'express';
import { clientJwtAuth } from '@/routes/middleware/auth';
import { logAuditAction } from '@/routes/utils/audit';
import {
  dispatchConversationAssigned,
  dispatchConversationPriorityChanged,
  dispatchConversationStatusChanged,
} from '@/routes/modules/platform/events/index';
import { emitAiOverrideChanged } from '@/routes/utils/gateway';
import { emitDashboardRefresh } from '@/routes/utils/dashboardEmitter';
import db from '@/routes/database';

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
    const messages = db.prepare(`SELECT im.id, im.from_number, im.from_name, im.message_type, im.content, im.media_url, im.is_read, im.timestamp, im.direction, im.customer_id, im.conversation_id, crm.confidence AS ai_confidence, crm.model AS ai_model, crm.prompt_version AS ai_prompt_version, crm.bot_version AS ai_bot_version, crm.sources AS ai_sources, crm.tools AS ai_tools, crm.matched_trigger AS ai_matched_trigger, crm.matched_rule AS ai_matched_rule, crm.skip_reason AS ai_skip_reason FROM inbox_messages im LEFT JOIN chatbot_response_metadata crm ON crm.message_id = im.id WHERE im.conversation_id = ? ORDER BY im.timestamp ASC LIMIT 500`).all(req.params.id) as Record<string, unknown>[];
    const formatted = messages.map(m => ({ id: m.id, fromNumber: m.from_number, fromName: m.from_name, messageType: m.message_type, content: m.content, mediaUrl: m.media_url, isRead: m.is_read, timestamp: m.timestamp, direction: m.direction, customerId: m.customer_id, conversationId: m.conversation_id, aiMetadata: m.ai_confidence != null ? { confidence: m.ai_confidence, model: m.ai_model ?? '', promptVersion: m.ai_prompt_version ?? null, botVersion: m.ai_bot_version ?? null, sources: m.ai_sources ? JSON.parse(m.ai_sources as string) : null, tools: m.ai_tools ? JSON.parse(m.ai_tools as string) : null, matchedTrigger: m.ai_matched_trigger ?? null, matchedRule: m.ai_matched_rule ?? null, skipReason: m.ai_skip_reason ?? null } : null }));
    res.json({ success: true, data: formatted });
  } catch (err) { errRes(res, err); }
}

export function handleGetTraces(req: Request, res: Response): void {
  try {
    const owned = db.prepare('SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const traces = db.prepare('SELECT message_id, step, duration_ms, metadata, created_at FROM chatbot_traces WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id) as Record<string, unknown>[];
    res.json({ success: true, data: traces.map(t => ({ messageId: t.message_id, step: t.step, durationMs: t.duration_ms, metadata: t.metadata ? JSON.parse(t.metadata as string) : null, createdAt: t.created_at })) });
  } catch (err) { errRes(res, err); }
}

export function handleGetPromptSnapshot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const msg = db.prepare('SELECT id, conversation_id FROM inbox_messages WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!msg) { res.status(404).json({ success: false, error: 'Message not found' }); return; }
    const meta = db.prepare('SELECT sources, tools, model, prompt_version, bot_version FROM chatbot_response_metadata WHERE message_id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!meta) { res.status(404).json({ success: false, error: 'No prompt snapshot for this message' }); return; }
    res.json({ success: true, data: { sources: meta.sources ? JSON.parse(meta.sources as string) : null, tools: meta.tools ? JSON.parse(meta.tools as string) : null, model: meta.model, promptVersion: meta.prompt_version ?? null, botVersion: meta.bot_version ?? null } });
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

export function handleGetOverride(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId;
    const bot = db.prepare(`SELECT cc.id as chatbot_id FROM chatbot_configs cc JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1 LEFT JOIN conversations c ON c.instance_id = cc.instance_id AND c.chat_id = ? WHERE cc.workspace_id = ? AND cc.enabled = 1 LIMIT 1`).get(chatId, workspaceId) as { chatbot_id: string } | undefined;
    if (!bot) { res.json({ success: true, data: { mode: null, hasChatbot: false } }); return; }
    const row = db.prepare('SELECT mode, expires_at, resume_policy, reason, overridden_by, overridden_at FROM chatbot_conversation_overrides WHERE conversation_id = ?').get(chatId) as { mode: string; expires_at: string | null; resume_policy: string | null; reason: string | null; overridden_by: string | null; overridden_at: string | null } | undefined;
    res.json({ success: true, data: { mode: row?.mode ?? null, hasChatbot: true, expiresAt: row?.expires_at ?? null, resumePolicy: row?.resume_policy ?? null, reason: row?.reason ?? null, overriddenBy: row?.overridden_by ?? null, overriddenAt: row?.overridden_at ?? null } });
  } catch (err) { errRes(res, err); }
}

export function handlePostTakeoverByJid(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId;
    const { note, agent_id, expires_at, resume_policy, reason } = req.body as Record<string, unknown>;
    const effectivePolicy = (resume_policy as string) || 'manual';
    const effectiveReason = (reason as string) || null;
    const bot = db.prepare(`SELECT cc.id as chatbot_id FROM chatbot_configs cc JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1 JOIN instances i ON i.id = cc.instance_id AND i.client_id = ? WHERE cc.workspace_id = ? AND cc.enabled = 1 LIMIT 1`).get(workspaceId, workspaceId) as { chatbot_id: string } | undefined;
    if (!bot) { res.status(409).json({ success: false, error: 'No active chatbot on this workspace' }); return; }
    db.prepare(`INSERT OR REPLACE INTO chatbot_conversation_overrides (conversation_id, chatbot_id, mode, overridden_by, note, overridden_at, expires_at, resume_policy, reason, status, source) VALUES (?, ?, 'manual', ?, ?, datetime('now'), ?, ?, ?, 'active', 'manual')`).run(chatId, bot.chatbot_id, agent_id ?? null, note ?? null, expires_at ?? null, effectivePolicy, effectiveReason);
    insertTimelineMessage(chatId, `Agent took over — AI paused${effectiveReason ? ` (${effectiveReason})` : ''}`, workspaceId);
    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId, mode: 'manual', overriddenBy: agent_id as string | undefined, expiresAt: expires_at as string | undefined, resumePolicy: effectivePolicy });
    logAuditAction(req, 'UPDATE', 'conversation', chatId, `Agent took over WhatsApp conversation from AI${effectiveReason ? ` (${effectiveReason})` : ''}`);
    res.json({ success: true, message: 'AI disabled for this conversation' });
  } catch (err) { errRes(res, err); }
}

export function handlePostTakeoverById(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const { note, agent_id, expires_at, resume_policy, reason } = req.body as Record<string, unknown>;
    const effectivePolicy = (resume_policy as string) || 'manual';
    const effectiveReason = (reason as string) || null;
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?').get(conversationId, workspaceId);
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const bot = db.prepare(`SELECT cc.id as chatbot_id FROM chatbot_configs cc JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1 JOIN conversations c ON c.instance_id = cc.instance_id WHERE c.id = ? AND cc.workspace_id = ? AND cc.enabled = 1 LIMIT 1`).get(conversationId, workspaceId) as { chatbot_id: string } | undefined;
    if (!bot) { res.status(409).json({ success: false, error: 'No active chatbot on this conversation' }); return; }
    db.prepare(`INSERT OR REPLACE INTO chatbot_conversation_overrides (conversation_id, chatbot_id, mode, overridden_by, note, overridden_at, expires_at, resume_policy, reason, status, source) VALUES (?, ?, 'manual', ?, ?, datetime('now'), ?, ?, ?, 'active', 'manual')`).run(conversationId, bot.chatbot_id, agent_id ?? null, note ?? null, expires_at ?? null, effectivePolicy, effectiveReason);
    insertTimelineMessage(conversationId, `Agent took over — AI paused${effectiveReason ? ` (${effectiveReason})` : ''}`, workspaceId);
    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'manual', overriddenBy: agent_id as string | undefined, expiresAt: expires_at as string | undefined, resumePolicy: effectivePolicy });
    logAuditAction(req, 'UPDATE', 'conversation', conversationId, `Agent took over conversation from AI${effectiveReason ? ` (${effectiveReason})` : ''}`);
    res.json({ success: true, message: 'AI disabled for this conversation' });
  } catch (err) { errRes(res, err); }
}

export function handleResumeAiByJid(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId;
    const info = db.prepare(`UPDATE chatbot_conversation_overrides SET status='cancelled', ended_at=?, ended_reason='admin_cancelled' WHERE conversation_id=? AND status='active'`).run(new Date().toISOString(), chatId);
    if (info.changes === 0) { res.status(409).json({ success: false, error: 'No active override to resume from' }); return; }
    insertTimelineMessage(chatId, 'Agent resumed AI control', workspaceId);
    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId, mode: 'ai' });
    logAuditAction(req, 'UPDATE', 'conversation', chatId, 'Agent resumed AI control on WhatsApp');
    res.json({ success: true, message: 'AI resumed for this conversation' });
  } catch (err) { errRes(res, err); }
}

export function handleResumeAiById(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?').get(conversationId, workspaceId);
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const info = db.prepare(`UPDATE chatbot_conversation_overrides SET status='cancelled', ended_at=?, ended_reason='admin_cancelled' WHERE conversation_id=? AND status='active'`).run(new Date().toISOString(), conversationId);
    if (info.changes === 0) { res.status(409).json({ success: false, error: 'No active override to resume from' }); return; }
    insertTimelineMessage(conversationId, 'Agent resumed AI control', workspaceId);
    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });
    logAuditAction(req, 'UPDATE', 'conversation', conversationId, 'Agent resumed AI control');
    res.json({ success: true, message: 'AI resumed for this conversation' });
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

export function handleGetAiMetadata(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const { messageId } = req.params;
    const msg = db.prepare('SELECT id FROM inbox_messages WHERE id = ? AND workspace_id = ?').get(messageId, workspaceId);
    if (!msg) { res.status(404).json({ success: false, error: 'Message not found' }); return; }
    const meta = db.prepare('SELECT * FROM chatbot_response_metadata WHERE message_id = ?').get(messageId);
    if (!meta) { res.status(404).json({ success: false, error: 'No AI metadata for this message' }); return; }
    res.json({ success: true, data: meta });
  } catch (err) { errRes(res, err); }
}
