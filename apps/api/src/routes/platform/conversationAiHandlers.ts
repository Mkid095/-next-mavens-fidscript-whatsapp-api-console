import { Request, Response } from 'express';
import db from '../../database.js';
import { wsId } from './conversationShared.js';

// =============================================================================
// GET /override/:chatId — check AI override mode for a WhatsApp chat
// =============================================================================
export async function getAiOverride(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const chatId = req.params.chatId;

    const bot = db.prepare(`
      SELECT cc.id as chatbot_id
      FROM chatbot_configs cc
      JOIN chatbot_triggers ct ON ct.chatbot_id = cc.id AND ct.enabled = 1
      LEFT JOIN conversations c ON c.instance_id = cc.instance_id AND c.chat_id = ?
      WHERE cc.workspace_id = ? AND cc.enabled = 1
      LIMIT 1
    `).get(chatId, workspaceId) as { chatbot_id: string } | undefined;

    if (!bot) {
      res.json({ success: true, data: { mode: null, hasChatbot: false } });
      return;
    }

    const row = db.prepare(
      'SELECT mode, expires_at, resume_policy, reason, overridden_by, overridden_at FROM chatbot_conversation_overrides WHERE conversation_id = ?'
    ).get(chatId) as { mode: string; expires_at: string | null; resume_policy: string | null; reason: string | null; overridden_by: string | null; overridden_at: string | null } | undefined;

    res.json({ success: true, data: {
      mode: row?.mode ?? null,
      hasChatbot: true,
      expiresAt: row?.expires_at ?? null,
      resumePolicy: row?.resume_policy ?? null,
      reason: row?.reason ?? null,
      overriddenBy: row?.overridden_by ?? null,
      overriddenAt: row?.overridden_at ?? null,
    } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// =============================================================================
// GET /messages/:messageId/ai-metadata — AI response metadata for a message
// =============================================================================
export async function getAiMetadata(req: Request, res: Response): Promise<void> {
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
}
