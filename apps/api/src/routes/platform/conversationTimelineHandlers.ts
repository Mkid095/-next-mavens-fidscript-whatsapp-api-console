import { Request, Response } from 'express';
import db from '../../database.js';
import { wsId } from './conversationShared.js';

// =============================================================================
// GET /:id/traces — all trace spans for a conversation
// =============================================================================
export async function getConversationTraces(req: Request, res: Response): Promise<void> {
  try {
    const owned = db.prepare(
      'SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Conversation not found' }); return; }

    const traces = db.prepare(`
      SELECT message_id, step, duration_ms, metadata, created_at
      FROM chatbot_traces
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id) as Record<string, unknown>[];

    res.json({
      success: true,
      data: traces.map(t => ({
        messageId: t.message_id,
        step: t.step,
        durationMs: t.duration_ms,
        metadata: t.metadata ? JSON.parse(t.metadata as string) : null,
        createdAt: t.created_at,
      })),
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// =============================================================================
// GET /messages/:id/prompt-snapshot — full prompt snapshot for one response message
// =============================================================================
export async function getPromptSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const workspaceId = wsId(req);
    const msg = db.prepare(
      'SELECT id, conversation_id FROM inbox_messages WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!msg) { res.status(404).json({ success: false, error: 'Message not found' }); return; }

    const meta = db.prepare(`
      SELECT sources, tools, model, prompt_version, bot_version
      FROM chatbot_response_metadata WHERE message_id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!meta) {
      res.status(404).json({ success: false, error: 'No prompt snapshot for this message' }); return;
    }

    res.json({
      success: true,
      data: {
        sources: meta.sources ? JSON.parse(meta.sources as string) : null,
        tools: meta.tools ? JSON.parse(meta.tools as string) : null,
        model: meta.model,
        promptVersion: meta.prompt_version ?? null,
        botVersion: meta.bot_version ?? null,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
