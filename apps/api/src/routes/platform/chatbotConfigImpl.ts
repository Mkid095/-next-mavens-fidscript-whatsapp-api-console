/**
 * Chatbot config implementation — updateAiConfig, updatePolicies, saveGroupSettings, assignContact, unassignContact.
 */

import type { Request, Response } from 'express';
import db from '../../database.js';
import { wsId } from './chatbotCrudHandlers.js';

export { wsId };

function botNotFound(res: Response): boolean {
  res.status(404).json({ success: false, error: 'Chatbot not found' });
  return true;
}

export function updateAiConfig(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { model, provider, prompt, system_prompt, hallucination_policy, max_tokens, temperature, top_p, max_history_messages, llm_connection_id } = req.body;
    db.prepare(`UPDATE chatbot_ai_configs SET
      model = COALESCE(?, model),
      provider = COALESCE(?, provider),
      prompt = COALESCE(?, prompt),
      system_prompt = COALESCE(?, system_prompt),
      hallucination_policy = COALESCE(?, hallucination_policy),
      max_tokens = COALESCE(?, max_tokens),
      temperature = COALESCE(?, temperature),
      top_p = COALESCE(?, top_p),
      max_history_messages = COALESCE(?, max_history_messages),
      llm_connection_id = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE chatbot_id = ?`
    ).run(model, provider, prompt, system_prompt, hallucination_policy, max_tokens, temperature, top_p, max_history_messages, llm_connection_id ?? null, req.params.id);

    res.json({ success: true, message: 'AI config updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function updatePolicies(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { confidence_threshold, escalate_on_low_confidence, requires_confirmation, max_retries, fallback_reply } = req.body;
    db.prepare(`UPDATE chatbot_response_policies SET
      confidence_threshold = COALESCE(?, confidence_threshold),
      escalate_on_low_confidence = COALESCE(?, escalate_on_low_confidence),
      requires_confirmation = COALESCE(?, requires_confirmation),
      max_retries = COALESCE(?, max_retries),
      fallback_reply = COALESCE(?, fallback_reply),
      updated_at = CURRENT_TIMESTAMP
      WHERE chatbot_id = ?`
    ).run(confidence_threshold, escalate_on_low_confidence, requires_confirmation, max_retries, fallback_reply, req.params.id);

    res.json({ success: true, message: 'Policies updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function saveGroupSettings(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { group_jid, respond_when_mentioned = true, respond_to_all = false, silence_on_bot_reply = true } = req.body;
    if (!group_jid) { res.status(400).json({ success: false, error: 'group_jid is required' }); return; }

    const id = `gs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_group_settings (id, chatbot_id, group_jid, respond_when_mentioned, respond_to_all, silence_on_bot_reply)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(chatbot_id, group_jid) DO UPDATE SET
        respond_when_mentioned = excluded.respond_when_mentioned,
        respond_to_all = excluded.respond_to_all,
        silence_on_bot_reply = excluded.silence_on_bot_reply,
        updated_at = CURRENT_TIMESTAMP`
    ).run(id, req.params.id, group_jid, respond_when_mentioned ? 1 : 0, respond_to_all ? 1 : 0, silence_on_bot_reply ? 1 : 0);

    res.status(201).json({ success: true, message: 'Group settings saved' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function assignContact(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const id = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT OR IGNORE INTO chatbot_contact_assignments (id, chatbot_id, contact_id)
      VALUES (?, ?, ?)`
    ).run(id, req.params.id, req.params.contactId);

    res.status(201).json({ success: true, message: 'Contact assigned' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function unassignContact(req: Request, res: Response): void {
  try {
    db.prepare('DELETE FROM chatbot_contact_assignments WHERE chatbot_id = ? AND contact_id = ?').run(req.params.id, req.params.contactId);
    res.json({ success: true, message: 'Contact unassigned' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
