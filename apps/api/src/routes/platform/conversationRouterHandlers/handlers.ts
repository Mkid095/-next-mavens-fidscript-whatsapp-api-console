import { Request, Response } from 'express';
import db from '../../../database.js';
import { logAuditAction } from '../../../utils/audit.js';
import { emitAiOverrideChanged } from '../../../utils/gateway.js';
import { insertTimelineMessage, resolveInstanceName, wsId } from '../conversationShared.js';

// =============================================================================
// POST /takeover/:chatId — take over by JID (WhatsApp path)
// =============================================================================
export async function takeoverByChatId(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId;
    const {
      note, agent_id,
      expires_at,
      resume_policy,
      reason,
    } = req.body as Record<string, unknown>;

    const effectivePolicy = (resume_policy as string) || 'manual';
    const effectiveReason = (reason as string) || null;

    const bot = db.prepare(`
      SELECT cc.id as chatbot_id
      FROM chatbot_configs cc
      JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1
      JOIN instances i ON i.id = cc.instance_id AND i.client_id = ?
      WHERE cc.workspace_id = ? AND cc.enabled = 1
      LIMIT 1
    `).get(workspaceId, workspaceId) as { chatbot_id: string } | undefined;

    if (!bot) {
      res.status(409).json({ success: false, error: 'No active chatbot on this workspace' });
      return;
    }

    db.prepare(`INSERT OR REPLACE INTO chatbot_conversation_overrides
      (conversation_id, chatbot_id, mode, overridden_by, note, overridden_at, expires_at, resume_policy, reason, status, source)
      VALUES (?, ?, 'manual', ?, ?, datetime('now'), ?, ?, ?, 'active', 'manual')`
    ).run(chatId, bot.chatbot_id, agent_id ?? null, note ?? null, expires_at ?? null, effectivePolicy, effectiveReason);

    insertTimelineMessage(chatId, `Agent took over — AI paused${effectiveReason ? ` (${effectiveReason})` : ''}`, workspaceId);

    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) {
      emitAiOverrideChanged(instanceName, {
        chatId, mode: 'manual',
        overriddenBy: agent_id as string | undefined,
        expiresAt: expires_at as string | undefined,
        resumePolicy: effectivePolicy,
      });
    }

    logAuditAction(req, 'UPDATE', 'conversation', chatId, `Agent took over WhatsApp conversation from AI${effectiveReason ? ` (${effectiveReason})` : ''}`);
    res.json({ success: true, message: 'AI disabled for this conversation' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// =============================================================================
// POST /:id/takeover — take over by conversation UUID (standard path)
// =============================================================================
export async function takeoverById(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const {
      note, agent_id,
      expires_at,
      resume_policy,
      reason,
    } = req.body as Record<string, unknown>;

    const effectivePolicy = (resume_policy as string) || 'manual';
    const effectiveReason = (reason as string) || null;

    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?')
      .get(conversationId, workspaceId);
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const bot = db.prepare(`
      SELECT cc.id as chatbot_id
      FROM chatbot_configs cc
      JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1
      JOIN conversations c ON c.instance_id = cc.instance_id
      WHERE c.id = ? AND cc.workspace_id = ? AND cc.enabled = 1
      LIMIT 1
    `).get(conversationId, workspaceId) as { chatbot_id: string } | undefined;

    if (!bot) {
      res.status(409).json({ success: false, error: 'No active chatbot on this conversation' });
      return;
    }

    db.prepare(`INSERT OR REPLACE INTO chatbot_conversation_overrides
      (conversation_id, chatbot_id, mode, overridden_by, note, overridden_at, expires_at, resume_policy, reason, status, source)
      VALUES (?, ?, 'manual', ?, ?, datetime('now'), ?, ?, ?, 'active', 'manual')`
    ).run(conversationId, bot.chatbot_id, agent_id ?? null, note ?? null, expires_at ?? null, effectivePolicy, effectiveReason);

    insertTimelineMessage(conversationId, `Agent took over — AI paused${effectiveReason ? ` (${effectiveReason})` : ''}`, workspaceId);

    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) {
      emitAiOverrideChanged(instanceName, {
        chatId: conversationId, mode: 'manual',
        overriddenBy: agent_id as string | undefined,
        expiresAt: expires_at as string | undefined,
        resumePolicy: effectivePolicy,
      });
    }

    logAuditAction(req, 'UPDATE', 'conversation', conversationId, `Agent took over conversation from AI${effectiveReason ? ` (${effectiveReason})` : ''}`);
    res.json({ success: true, message: 'AI disabled for this conversation' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// =============================================================================
// POST /resume-ai/:chatId — resume AI by JID (WhatsApp path)
// =============================================================================
export async function resumeAiByChatId(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId;

    const info = db.prepare(
      `UPDATE chatbot_conversation_overrides SET status='cancelled', ended_at=?, ended_reason='admin_cancelled' WHERE conversation_id=? AND status='active'`
    ).run(new Date().toISOString(), chatId);

    if (info.changes === 0) {
      res.status(409).json({ success: false, error: 'No active override to resume from' });
      return;
    }

    insertTimelineMessage(chatId, 'Agent resumed AI control', workspaceId);

    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId, mode: 'ai' });

    logAuditAction(req, 'UPDATE', 'conversation', chatId, 'Agent resumed AI control on WhatsApp');
    res.json({ success: true, message: 'AI resumed for this conversation' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// =============================================================================
// POST /:id/resume-ai — resume AI by conversation UUID (standard path)
// =============================================================================
export async function resumeAiById(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;

    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?')
      .get(conversationId, workspaceId);
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const info = db.prepare(
      `UPDATE chatbot_conversation_overrides SET status='cancelled', ended_at=?, ended_reason='admin_cancelled' WHERE conversation_id=? AND status='active'`
    ).run(new Date().toISOString(), conversationId);

    if (info.changes === 0) {
      res.status(409).json({ success: false, error: 'No active override to resume from' });
      return;
    }

    insertTimelineMessage(conversationId, 'Agent resumed AI control', workspaceId);

    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });

    logAuditAction(req, 'UPDATE', 'conversation', conversationId, 'Agent resumed AI control');
    res.json({ success: true, message: 'AI resumed for this conversation' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
