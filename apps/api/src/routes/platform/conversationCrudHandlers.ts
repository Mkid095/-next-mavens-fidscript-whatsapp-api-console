import { Request, Response } from 'express';
import db from '../../database.js';
import { wsId } from './conversationShared.js';

// =============================================================================
// GET / — list conversations
// =============================================================================
export async function listConversations(req: Request, res: Response): Promise<void> {
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
      const userId = (req as any).workspace?.userId;
      if (userId) {
        sql += ' AND conv.assignee_type = ? AND conv.assignee_id = ?'; params.push('user', userId);
      }
    } else if (assignee === 'unassigned') {
      sql += ' AND conv.assignee_type = ?'; params.push('unassigned');
    } else if (assignee === 'team') {
      sql += " AND conv.assignee_type = ? AND conv.assignee_id IS NOT NULL"; params.push('team');
    }
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
}

// =============================================================================
// GET /:id/messages — full thread for a conversation
// =============================================================================
export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  try {
    const owned = db.prepare(
      'SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const messages = db.prepare(`
      SELECT
        im.id,
        im.from_number,
        im.from_name,
        im.message_type,
        im.content,
        im.media_url,
        im.is_read,
        im.timestamp,
        im.direction,
        im.customer_id,
        im.conversation_id,
        crm.confidence       AS ai_confidence,
        crm.model           AS ai_model,
        crm.prompt_version  AS ai_prompt_version,
        crm.bot_version     AS ai_bot_version,
        crm.sources         AS ai_sources,
        crm.tools           AS ai_tools,
        crm.matched_trigger AS ai_matched_trigger,
        crm.matched_rule    AS ai_matched_rule,
        crm.skip_reason     AS ai_skip_reason
      FROM inbox_messages im
      LEFT JOIN chatbot_response_metadata crm ON crm.message_id = im.id
      WHERE im.conversation_id = ?
      ORDER BY im.timestamp ASC LIMIT 500
    `).all(req.params.id) as Record<string, unknown>[];

    const formatted = messages.map(m => ({
      id: m.id,
      fromNumber: m.from_number,
      fromName: m.from_name,
      messageType: m.message_type,
      content: m.content,
      mediaUrl: m.media_url,
      isRead: m.is_read,
      timestamp: m.timestamp,
      direction: m.direction,
      customerId: m.customer_id,
      conversationId: m.conversation_id,
      aiMetadata: m.ai_confidence != null ? {
        confidence: m.ai_confidence,
        model: m.ai_model ?? '',
        promptVersion: m.ai_prompt_version ?? null,
        botVersion: m.ai_bot_version ?? null,
        sources: m.ai_sources ? JSON.parse(m.ai_sources as string) : null,
        tools: m.ai_tools ? JSON.parse(m.ai_tools as string) : null,
        matchedTrigger: m.ai_matched_trigger ?? null,
        matchedRule: m.ai_matched_rule ?? null,
        skipReason: m.ai_skip_reason ?? null,
      } : null,
    }));

    res.json({ success: true, data: formatted });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
