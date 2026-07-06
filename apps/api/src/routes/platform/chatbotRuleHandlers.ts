/**
 * Chatbot rule handlers — createRule, updateRule, deleteRule, createHandoffRule.
 */

import type { Request, Response } from 'express';
import db from '../../database.js';
import { wsId } from './chatbotCrudHandlers.js';

export { wsId };

function botNotFound(res: Response): boolean {
  res.status(404).json({ success: false, error: 'Chatbot not found' });
  return true;
}

export function createRule(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { name = '', conditions_json = '[]', action, action_config_json = '{}', priority = 0, enabled = true } = req.body;
    if (!action) { res.status(400).json({ success: false, error: 'action is required' }); return; }

    const id = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_response_rules (id, chatbot_id, name, conditions_json, action, action_config_json, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.params.id, name, conditions_json, action, action_config_json, priority, enabled ? 1 : 0);

    res.status(201).json({ success: true, data: { id }, message: 'Rule created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function updateRule(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { name, conditions_json, action, action_config_json, priority, enabled } = req.body;
    db.prepare(`UPDATE chatbot_response_rules SET
      name = COALESCE(?, name),
      conditions_json = COALESCE(?, conditions_json),
      action = COALESCE(?, action),
      action_config_json = COALESCE(?, action_config_json),
      priority = COALESCE(?, priority),
      enabled = COALESCE(?, enabled)
      WHERE id = ? AND chatbot_id = ?`
    ).run(name, conditions_json, action, action_config_json, priority, enabled !== undefined ? (enabled ? 1 : 0) : null, req.params.ruleId, req.params.id);

    res.json({ success: true, message: 'Rule updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function deleteRule(req: Request, res: Response): void {
  try {
    db.prepare('DELETE FROM chatbot_response_rules WHERE id = ? AND chatbot_id = ?').run(req.params.ruleId, req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function createHandoffRule(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { botNotFound(res); return; }

    const { name = '', conditions_json = '[]', target_team_id = '', target_team_name = '', priority = 0, enabled = true } = req.body;
    const id = `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_handoff_rules (id, chatbot_id, name, conditions_json, target_team_id, target_team_name, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.params.id, name, conditions_json, target_team_id, target_team_name, priority, enabled ? 1 : 0);

    res.status(201).json({ success: true, data: { id }, message: 'Handoff rule created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
