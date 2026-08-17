/**
 * conversationManageHandlers.ts - /api/platform/conversations/:id
 * updateConversation handler + assign/transfer/release barrel.
 */
import { Request, Response } from 'express';
import { logAuditAction } from '../../utils/audit.js';
import { dispatchConversationAssigned, dispatchConversationPriorityChanged, dispatchConversationStatusChanged } from '../../modules/platform/events/index.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import db from '../../database.js';
import { buildCtx, insertTimelineMessage } from './conversationShared.js';
import { wsId, getConversation } from './conversationUpdateHelpers.js';
import { assignConversation, transferConversation, releaseConversation } from './conversationUpdateHandlers.js';

export { assignConversation, transferConversation, releaseConversation };

export async function updateConversation(req: Request, res: Response): Promise<void> {
  try {
    const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND workspace_id = ?')
      .get(req.params.id, wsId(req)) as Record<string, unknown> | undefined;
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
}
