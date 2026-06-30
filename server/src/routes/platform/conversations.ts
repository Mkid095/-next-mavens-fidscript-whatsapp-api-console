import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import { dispatchConversationAssigned, dispatchConversationPriorityChanged, dispatchConversationStatusChanged } from '../../modules/platform/events/index.js';
import { emitAiOverrideChanged } from '../../utils/gateway.js';
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

/** Insert a system/timeline message into the inbox for audit purposes. */
function insertTimelineMessage(conversationId: string, content: string, workspaceId: string): void {
  db.prepare(`INSERT INTO inbox_messages
    (id, conversation_id, workspace_id, from_number, from_name, message_type, content, direction, is_read, timestamp, is_system)
    VALUES (?, ?, ?, '', ?, 'text', ?, 'system', 1, ?, 1)`
  ).run(
    `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId, workspaceId, content, new Date().toISOString(),
  );
}

/** Resolve an instance name for a workspace (client_id). Used for SSE emission. */
function resolveInstanceName(workspaceId: string): string | null {
  const row = db.prepare(
    'SELECT name FROM instances WHERE client_id = ? LIMIT 1'
  ).get(workspaceId) as { name: string } | undefined;
  return row?.name ?? null;
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

// ─── Human Takeover ───────────────────────────────────────────────────────────────

// GET /override/:chatId — check AI override mode for a WhatsApp chat (by JID).
// Returns { mode: 'ai' | 'manual' | null }.
router.get('/override/:chatId', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId; // JID for WhatsApp chats

    // Find the bot active on this chat's instance.
    // conversations.chat_id stores the JID for WhatsApp conversations.
    const bot = db.prepare(`
      SELECT cc.id as chatbot_id
      FROM chatbot_configs cc
      JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1
      LEFT JOIN conversations c ON c.instance_id = cc.instance_id AND c.chat_id = ?
      WHERE cc.workspace_id = ? AND cc.enabled = 1
      LIMIT 1
    `).get(chatId, workspaceId) as { chatbot_id: string } | undefined;

    if (!bot) {
      res.json({ success: true, data: { mode: null } });
      return;
    }

    const row = db.prepare(
      'SELECT mode, expires_at, resume_policy, reason, overridden_by, overridden_at FROM chatbot_conversation_overrides WHERE conversation_id = ?'
    ).get(chatId) as { mode: string; expires_at: string | null; resume_policy: string | null; reason: string | null; overridden_by: string | null; overridden_at: string | null } | undefined;

    res.json({ success: true, data: {
      mode: row?.mode ?? null,
      expiresAt: row?.expires_at ?? null,
      resumePolicy: row?.resume_policy ?? null,
      reason: row?.reason ?? null,
      overriddenBy: row?.overridden_by ?? null,
      overriddenAt: row?.overridden_at ?? null,
    } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/:id/takeover', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const {
      note, agent_id, chat_id,
      expires_at,          // ISO timestamp or null
      resume_policy,       // 'manual' | 'next_message' | 'timeout'
      reason,              // handoff reason code
    } = req.body as Record<string, unknown>;

    const effectivePolicy = (resume_policy as string) || 'manual';
    const effectiveReason = (reason as string) || null;

    // WhatsApp path: chat_id (JID) is passed directly — no conversations UUID needed.
    // The override key is the JID itself, matching what the worker uses.
    if (chat_id && typeof chat_id === 'string') {
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
      ).run(chat_id, bot.chatbot_id, agent_id ?? null, note ?? null, expires_at ?? null, effectivePolicy, effectiveReason);

      // Timeline message
      insertTimelineMessage(chat_id, `Agent took over — AI paused${effectiveReason ? ` (${effectiveReason})` : ''}`, workspaceId);

      // Emit SSE
      const instanceName = resolveInstanceName(workspaceId);
      if (instanceName) {
        emitAiOverrideChanged(instanceName, {
          chatId: chat_id, mode: 'manual',
          overriddenBy: agent_id as string | undefined,
          expiresAt: expires_at as string | undefined,
          resumePolicy: effectivePolicy,
        });
      }

      logAuditAction(req, 'UPDATE', 'conversation', chat_id, `Agent took over WhatsApp conversation from AI${effectiveReason ? ` (${effectiveReason})` : ''}`);
      res.json({ success: true, message: 'AI disabled for this conversation' });
      return;
    }

    // Standard path: conversation UUID
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?')
      .get(conversationId, workspaceId);
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    // Look up which bot is active for this conversation (if any)
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

    // Timeline message
    insertTimelineMessage(conversationId, `Agent took over — AI paused${effectiveReason ? ` (${effectiveReason})` : ''}`, workspaceId);

    // Emit SSE
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
});

router.post('/:id/resume-ai', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const conversationId = req.params.id;
    const { chat_id } = req.body as Record<string, unknown>;

    // WhatsApp path: chat_id (JID) is passed directly
    if (chat_id && typeof chat_id === 'string') {
      const info = db.prepare(
        `UPDATE chatbot_conversation_overrides SET status='cancelled', ended_at=?, ended_reason='admin_cancelled' WHERE conversation_id=? AND status='active'`
      ).run(new Date().toISOString(), chat_id as string);

      if (info.changes === 0) {
        res.status(409).json({ success: false, error: 'No active override to resume from' });
        return;
      }

      // Timeline message
      insertTimelineMessage(chat_id as string, 'Agent resumed AI control', workspaceId);

      // Emit SSE
      const instanceName = resolveInstanceName(workspaceId);
      if (instanceName) emitAiOverrideChanged(instanceName, { chatId: chat_id as string, mode: 'ai' });

      logAuditAction(req, 'UPDATE', 'conversation', chat_id as string, 'Agent resumed AI control on WhatsApp');
      res.json({ success: true, message: 'AI resumed for this conversation' });
      return;
    }

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

    // Timeline message
    insertTimelineMessage(conversationId, 'Agent resumed AI control', workspaceId);

    // Emit SSE
    const instanceName = resolveInstanceName(workspaceId);
    if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });

    logAuditAction(req, 'UPDATE', 'conversation', conversationId, 'Agent resumed AI control');
    res.json({ success: true, message: 'AI resumed for this conversation' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── AI Response Metadata ───────────────────────────────────────────────────────

router.get('/messages/:messageId/ai-metadata', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const { messageId } = req.params;

    const msg = db.prepare(
      'SELECT id FROM inbox_messages WHERE id = ? AND workspace_id = ?'
    ).get(messageId, workspaceId);
    if (!msg) { res.status(404).json({ success: false, error: 'Message not found' }); return; }

    const meta = db.prepare(
      'SELECT * FROM chatbot_response_metadata WHERE message_id = ?'
    ).get(messageId);

    if (!meta) {
      res.status(404).json({ success: false, error: 'No AI metadata for this message' });
      return;
    }

    res.json({ success: true, data: meta });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
