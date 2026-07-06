/**
 * conversationUpdateHandlers.ts — assign, transfer, release handlers.
 */
import { Request, Response } from 'express';
import { logAuditAction } from '../../utils/audit.js';
import { dispatchConversationAssigned, dispatchConversationPriorityChanged, dispatchConversationStatusChanged } from '../../modules/platform/events/index.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import db from '../../database.js';
import { buildCtx, insertTimelineMessage } from './conversationShared.js';
import {
  wsId, getConversation, getActiveAssignment, getUserName,
  checkWorkspaceMembership, insertAssignment, releaseAssignment, transferAssignment,
} from './conversationUpdateHelpers.js';

export async function assignConversation(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const { userId, teamId, notes } = req.body as Record<string, unknown>;
    const authReq = req as any;
    const actorUserId = authReq.workspace?.userId ?? workspaceId;

    if (!userId && !teamId) { res.status(400).json({ success: false, error: 'userId or teamId is required' }); return; }
    if (userId && teamId) { res.status(400).json({ success: false, error: 'provide only userId OR teamId, not both' }); return; }
    if (!getConversation(conversationId, workspaceId)) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    if (userId && !checkWorkspaceMembership(workspaceId, userId as string)) {
      res.status(400).json({ success: false, error: 'User is not a member of this workspace' }); return;
    }

    const assigneeType = userId ? 'user' : 'team';
    const assigneeId = (userId ?? teamId) as string;

    insertAssignment({ conversationId, userId: userId as string | null, teamId: teamId as string | null, actorUserId, assigneeType, notes: notes as string | null });

    db.prepare(`
      UPDATE conversations SET assignee_type=?, assignee_id=?, team_id=?, active_agent_id=?, status='Assigned' WHERE id=?
    `).run(assigneeType, userId ?? null, teamId ?? null, userId ?? null, conversationId);

    const assigneeName = userId ? getUserName(userId as string) : assigneeId;
    insertTimelineMessage(conversationId, `Conversation assigned to ${assigneeName}`, workspaceId);
    emitDashboardRefresh(workspaceId);

    await dispatchConversationAssigned(
      { workspaceId, actorUserId, roleId: authReq.workspace?.roleId ?? 'role_0', perms: authReq.workspace?.perms ?? ['*'] },
      { conversationId, assigneeType, assigneeId, byUserId: actorUserId }
    );
    logAuditAction(req, 'ASSIGN', 'conversation', conversationId, `Assigned to ${assigneeName}`);
    res.json({ success: true, message: `Assigned to ${assigneeName}` });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function transferConversation(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const { userId, teamId, notes } = req.body as Record<string, unknown>;
    const authReq = req as any;
    const actorUserId = authReq.workspace?.userId ?? workspaceId;

    if (!userId && !teamId) { res.status(400).json({ success: false, error: 'userId or teamId is required' }); return; }
    if (userId && teamId) { res.status(400).json({ success: false, error: 'provide only userId OR teamId, not both' }); return; }
    if (!getConversation(conversationId, workspaceId)) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    if (userId && !checkWorkspaceMembership(workspaceId, userId as string)) {
      res.status(400).json({ success: false, error: 'User is not a member of this workspace' }); return;
    }

    const current = getActiveAssignment(conversationId);
    const fromName = current?.user_id ? getUserName(current.user_id) : current?.team_id ?? 'unknown';

    transferAssignment(conversationId);

    const assigneeType = userId ? 'user' : 'team';
    const assigneeId = (userId ?? teamId) as string;

    insertAssignment({ conversationId, userId: userId as string | null, teamId: teamId as string | null, actorUserId, assigneeType, notes: notes as string | null });

    db.prepare(`UPDATE conversations SET assignee_type=?, assignee_id=?, team_id=?, active_agent_id=?, status='Assigned' WHERE id=?`)
      .run(assigneeType, userId ?? null, teamId ?? null, userId ?? null, conversationId);

    const toName = userId ? getUserName(userId as string) : assigneeId;
    insertTimelineMessage(conversationId, `Conversation transferred from ${fromName} to ${toName}`, workspaceId);
    emitDashboardRefresh(workspaceId);

    await dispatchConversationAssigned(
      { workspaceId, actorUserId, roleId: authReq.workspace?.roleId ?? 'role_0', perms: authReq.workspace?.perms ?? ['*'] },
      { conversationId, assigneeType, assigneeId, byUserId: actorUserId }
    );
    logAuditAction(req, 'TRANSFER', 'conversation', conversationId, `Transferred from ${fromName} to ${toName}`);
    res.json({ success: true, message: `Transferred from ${fromName} to ${toName}` });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function releaseConversation(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const authReq = req as any;
    const actorUserId = authReq.workspace?.userId ?? workspaceId;

    if (!getConversation(conversationId, workspaceId)) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const current = getActiveAssignment(conversationId);
    const releasedBy = current?.user_id ? getUserName(current.user_id) : current?.team_id ?? actorUserId;

    if (current) releaseAssignment(current.id);

    db.prepare(`UPDATE conversations SET assignee_type='unassigned', assignee_id=null, team_id=null, active_agent_id=null, status='resolved' WHERE id=?`)
      .run(conversationId);

    insertTimelineMessage(conversationId, `Conversation released by ${releasedBy}`, workspaceId);
    emitDashboardRefresh(workspaceId);

    await dispatchConversationAssigned(
      { workspaceId, actorUserId, roleId: authReq.workspace?.roleId ?? 'role_0', perms: authReq.workspace?.perms ?? ['*'] },
      { conversationId, assigneeType: 'unassigned', assigneeId: null, byUserId: actorUserId }
    );
    logAuditAction(req, 'RELEASE', 'conversation', conversationId, 'Conversation released');
    res.json({ success: true, message: 'Conversation released' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
