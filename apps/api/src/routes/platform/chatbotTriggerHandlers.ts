/**
 * Chatbot trigger handlers — createTrigger, deleteTrigger, testTrigger.
 */

import type { Request, Response } from 'express';
import db from '../../database.js';
import { evaluateTriggers } from '../../modules/ai/chatbotEngine.js';
import { wsId } from './chatbotCrudHandlers.js';

export { wsId };

function botNotFound(res: Response): boolean {
  res.status(404).json({ success: false, error: 'Chatbot not found' });
  return true;
}

export function createTrigger(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { trigger_type, trigger_value = '', keyword_mode = 'contains', require_previous_bot_reply = 0, enabled = true, priority = 0 } = req.body;
    const id = `trig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_triggers (id, chatbot_id, trigger_type, trigger_value, keyword_mode, require_previous_bot_reply, enabled, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.params.id, trigger_type, trigger_value, keyword_mode, require_previous_bot_reply ? 1 : 0, enabled ? 1 : 0, priority);

    res.status(201).json({ success: true, data: { id }, message: 'Trigger created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function deleteTrigger(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    db.prepare('DELETE FROM chatbot_triggers WHERE id = ? AND chatbot_id = ?').run(req.params.triggerId, req.params.id);
    res.json({ success: true, message: 'Trigger deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function testTrigger(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { message, contact_id, conversation_id } = req.body;
    if (!message) { res.status(400).json({ success: false, error: 'message is required' }); return; }

    const result = evaluateTriggers(req.params.id, message, {
      workspaceId, contactId: contact_id, conversationId: conversation_id,
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
