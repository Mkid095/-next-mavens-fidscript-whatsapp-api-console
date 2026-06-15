import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import { dispatchConversationAssigned, dispatchConversationPriorityChanged, dispatchConversationStatusChanged } from '../../modules/platform/events/index.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/conversations — conversation reads + operational updates (§9).
// Workspace-scoped. Updates also emit domain events + audit rows.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return req.client!.id;
}

function buildCtx(req: Request) {
  const workspaceId = wsId(req);
  return { workspaceId, actorUserId: workspaceId, roleId: 'role_0', perms: ['*'] };
}

// GET / — list conversations (?status=&assignee=&priority=&q=&sla_at_risk=&teams=)
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, assignee, priority, sla_at_risk, teams } = req.query;
    const q = (req.query.q as string | undefined)?.trim();

    let sql = `
      SELECT conv.id, conv.customer_id, conv.channel, conv.instance_id, conv.chat_id,
             conv.status, conv.priority, conv.assignee_type, conv.assignee_id, conv.team_id,
             conv.unread_count, conv.last_message_at, conv.ai_state,
             conv.response_due_at, conv.resolution_due_at, conv.breached_at,
             conv.created_at,
             c.display_name as customer_name,
             (SELECT content FROM inbox_messages WHERE conversation_id = conv.id
              ORDER BY timestamp DESC LIMIT 1) as last_message,
             (SELECT message_type FROM inbox_messages WHERE conversation_id = conv.id
              ORDER BY timestamp DESC LIMIT 1) as last_message_type
      FROM conversations conv
      LEFT JOIN customers c ON c.id = conv.customer_id
      WHERE conv.workspace_id = ?
    `;
    const params: unknown[] = [wsId(req)];
    if (status) { sql += ' AND conv.status = ?'; params.push(status); }
    if (priority) { sql += ' AND conv.priority = ?'; params.push(priority); }
    if (assignee === 'me') {
      sql += ' AND conv.assignee_type = ?'; params.push('user');
    } else if (assignee === 'unassigned') {
      sql += ' AND conv.assignee_type = ?'; params.push('unassigned');
    } else if (assignee === 'team') {
      sql += " AND conv.assignee_type = ? AND conv.assignee_id IS NOT NULL"; params.push('team');
    }
    // SLA at risk: response_due_at set, not yet resolved, due within next hour or already breached
    if (sla_at_risk === '1' || sla_at_risk === 'true') {
      sql += ` AND conv.status NOT IN ('resolved', 'closed')
               AND conv.response_due_at IS NOT NULL
               AND (
                 conv.breached_at IS NOT NULL
                 OR (conv.first_response_at IS NULL
                     AND conv.response_due_at <= datetime('now', '+1 hour'))
               )`;
    }
    if (q) { sql += ' AND (c.display_name LIKE ? OR conv.chat_id LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    sql += ' ORDER BY conv.last_message_at DESC NULLS LAST LIMIT 200';

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /:id/messages — full thread for a conversation
router.get('/:id/messages', (req: Request, res: Response) => {
  try {
    const owned = db.prepare(
      'SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    const messages = db.prepare(`
      SELECT id, from_number, from_name, message_type, content, media_url,
             is_read, timestamp, direction, customer_id
      FROM inbox_messages WHERE conversation_id = ?
      ORDER BY timestamp ASC LIMIT 500
    `).all(req.params.id);
    res.json({ success: true, data: messages });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// PATCH /:id — update status / priority / assignee (emits events + audit)
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const conv = db.prepare(
      'SELECT * FROM conversations WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, wsId(req)) as Record<string, unknown> | undefined;
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const ctx = buildCtx(req);
    const { status, priority, assignee_type, assignee_id } = req.body as Record<string, unknown>;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (status && status !== conv.status) {
      updates.push('status = ?'); params.push(status);
      dispatchConversationStatusChanged(ctx, {
        conversationId: req.params.id,
        status: status as 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed',
        byUserId: wsId(req),
      }).catch(() => {});
    }
    if (priority && priority !== conv.priority) {
      updates.push('priority = ?'); params.push(priority);
      dispatchConversationPriorityChanged(ctx, {
        conversationId: req.params.id,
        priority: priority as 'urgent' | 'high' | 'medium' | 'low',
        byUserId: wsId(req),
      }).catch(() => {});
    }
    if (assignee_type) {
      updates.push('assignee_type = ?', 'assignee_id = ?');
      params.push(assignee_type, assignee_id ?? null);
      dispatchConversationAssigned(ctx, {
        conversationId: req.params.id,
        assigneeType: assignee_type as 'user' | 'team' | 'unassigned',
        assigneeId: (assignee_id as string) ?? null,
        byUserId: wsId(req),
      }).catch(() => {});
    }

    if (updates.length) {
      params.push(req.params.id);
      db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      logAuditAction(req, 'CONVERSATION_UPDATED', 'conversation', req.params.id, JSON.stringify(req.body));
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
