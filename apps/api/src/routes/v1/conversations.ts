/**
 * /api/v1/conversations — read-only conversation API for external developers.
 * Auth: API key. Returns workspace-scoped data.
 */
import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ } from '../../middleware/auth/v1Limits.js';
import db from '../../database.js';

const router = Router();
router.use(clientApiKeyAuth, V1_READ);

function clientId(req: Request): string { return req.client!.id; }

/** GET /api/v1/conversations — list conversations */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, q } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    let sql = `
      SELECT conv.id, conv.customer_id, conv.channel, conv.instance_id, conv.chat_id,
             conv.status, conv.priority, conv.assignee_type, conv.assignee_id, conv.team_id,
             conv.unread_count, conv.last_message_at, conv.ai_state,
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
    const params: unknown[] = [clientId(req)];

    if (status) { sql += ' AND conv.status = ?'; params.push(String(status)); }
    if (q) { sql += ' AND (c.display_name LIKE ? OR conv.chat_id LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    sql += ' ORDER BY conv.last_message_at DESC NULLS LAST LIMIT ?';
    params.push(limit);

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** GET /api/v1/conversations/:id — conversation detail */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const conv = db.prepare(`
      SELECT conv.*, c.display_name as customer_name
      FROM conversations conv
      LEFT JOIN customers c ON c.id = conv.customer_id
      WHERE conv.id = ? AND conv.workspace_id = ?
    `).get(req.params.id, clientId(req));
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }
    res.json({ success: true, data: conv });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** POST /api/v1/conversations/:id/assign — assign or update priority */
router.post('/:id/assign', (req: Request, res: Response) => {
  try {
    const { status, priority, assignee_type, assignee_id } = req.body as {
      status?: string;
      priority?: string;
      assignee_type?: string;
      assignee_id?: string;
    };
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND workspace_id = ?')
      .get(req.params.id, clientId(req));
    if (!conv) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const updates: string[] = [];
    const vals: unknown[] = [];
    if (status) { updates.push('status = ?'); vals.push(status); }
    if (priority) { updates.push('priority = ?'); vals.push(priority); }
    if (assignee_type) { updates.push('assignee_type = ?'); vals.push(assignee_type); }
    if (assignee_id !== undefined) { updates.push('assignee_id = ?'); vals.push(assignee_id ?? null); }
    if (updates.length === 0) { res.status(400).json({ success: false, error: 'No fields to update' }); return; }

    vals.push(req.params.id, clientId(req));
    db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ? AND workspace_id = ?`).run(...vals);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** GET /api/v1/conversations/:id/messages — full message thread */
router.get('/:id/messages', (req: Request, res: Response) => {
  try {
    const owned = db.prepare(
      'SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, clientId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const messages = db.prepare(`
      SELECT id, from_number, from_name, message_type, content, media_url,
             is_read, timestamp, direction, conversation_id
      FROM inbox_messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
      LIMIT 500
    `).all(req.params.id);

    res.json({ success: true, data: messages });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
