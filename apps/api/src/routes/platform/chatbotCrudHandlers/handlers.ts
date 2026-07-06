/**
 * Chatbot CRUD Handlers — list, get, create, update, delete, toggle.
 *
 * Side-effect: ensures chatbot_response_rules table exists (may not have been
 * created by phase9 migration if DB was already past that version).
 */

import type { Request, Response } from 'express';
import db from '../../../database.js';
import { logAuditAction } from '../../../utils/audit.js';

try {
  db.prepare(`CREATE TABLE IF NOT EXISTS chatbot_response_rules (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    name TEXT DEFAULT '',
    conditions_json TEXT DEFAULT '[]',
    action TEXT NOT NULL CHECK(action IN ('ai','manual','skip','workflow')),
    action_config_json TEXT DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`).run();
} catch (_) { /* ok */ }
try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_response_rules_chatbot ON chatbot_response_rules(chatbot_id)`).run(); } catch (_) { /* ok */ }

export function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

export function listChatbots(req: Request, res: Response): void {
  try {
    const rows = db.prepare(`
      SELECT cc.*,
             ci.name as instance_name,
             (SELECT COUNT(*) FROM chatbot_triggers WHERE chatbot_id = cc.id AND enabled = 1) as trigger_count,
             (SELECT COUNT(*) FROM chatbot_contact_assignments WHERE chatbot_id = cc.id) as contact_count
      FROM chatbot_configs cc
      LEFT JOIN instances ci ON ci.id = cc.instance_id
      WHERE cc.workspace_id = ?
      ORDER BY cc.priority DESC, cc.created_at DESC
    `).all(wsId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function getChatbot(req: Request, res: Response): void {
  try {
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, wsId(req));
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const [aiConfig, capabilities, triggers, rules, policies, handoffRules, groupSettings] = [
      db.prepare('SELECT * FROM chatbot_ai_configs WHERE chatbot_id = ?').all(req.params.id),
      db.prepare('SELECT * FROM chatbot_capabilities WHERE chatbot_id = ?').all(req.params.id),
      db.prepare('SELECT * FROM chatbot_triggers WHERE chatbot_id = ? ORDER BY priority DESC').all(req.params.id),
      db.prepare('SELECT * FROM chatbot_response_rules WHERE chatbot_id = ? ORDER BY priority DESC').all(req.params.id),
      db.prepare('SELECT * FROM chatbot_response_policies WHERE chatbot_id = ?').all(req.params.id),
      db.prepare('SELECT * FROM chatbot_handoff_rules WHERE chatbot_id = ? ORDER BY priority DESC').all(req.params.id),
      db.prepare('SELECT cgs.*, cgi.subject as group_name FROM chatbot_group_settings cgs LEFT JOIN cached_group_info cgi ON cgi.group_jid = cgs.group_jid WHERE cgs.chatbot_id = ?').all(req.params.id),
    ];

    res.json({ success: true, data: { ...bot, aiConfig, capabilities, triggers, rules, policies, handoffRules, groupSettings } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function createChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const { instance_id, name, description = '', priority = 0, config_json = '{}', enabled = true } = req.body;

    if (!instance_id || !name) {
      res.status(400).json({ success: false, error: 'instance_id and name are required' });
      return;
    }

    const instance = db.prepare(
      'SELECT id FROM instances WHERE id = ? AND client_id = ?'
    ).get(instance_id, workspaceId);
    if (!instance) {
      res.status(400).json({ success: false, error: 'Invalid instance_id' });
      return;
    }

    const id = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_configs
      (id, workspace_id, instance_id, name, description, priority, config_json, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, workspaceId, instance_id, name, description, priority, config_json, enabled ? 1 : 0);

    db.prepare('INSERT INTO chatbot_ai_configs (id, chatbot_id) VALUES (?, ?)').run(`aicfg_${Date.now()}`, id);
    db.prepare('INSERT INTO chatbot_response_policies (id, chatbot_id) VALUES (?, ?)').run(`pol_${Date.now()}`, id);

    logAuditAction(req, 'CREATE', 'chatbot', id, `Created chatbot "${name}"`);
    res.status(201).json({ success: true, data: { id }, message: 'Chatbot created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function updateChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { name, description, priority, config_json, enabled, instance_id } = req.body;
    if (instance_id) {
      const instance = db.prepare('SELECT id FROM instances WHERE id = ? AND client_id = ?').get(instance_id, workspaceId);
      if (!instance) {
        res.status(400).json({ success: false, error: 'Invalid instance_id' });
        return;
      }
    }

    db.prepare(`UPDATE chatbot_configs SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      config_json = COALESCE(?, config_json),
      enabled = COALESCE(?, enabled),
      instance_id = COALESCE(?, instance_id),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(name, description, priority, config_json, enabled !== undefined ? (enabled ? 1 : 0) : null, instance_id, req.params.id);

    logAuditAction(req, 'UPDATE', 'chatbot', req.params.id, `Updated chatbot "${name ?? req.params.id}"`);
    res.json({ success: true, message: 'Chatbot updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function deleteChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    db.prepare('DELETE FROM chatbot_configs WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'DELETE', 'chatbot', req.params.id, `Deleted chatbot`);
    res.json({ success: true, message: 'Chatbot deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function toggleChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { enabled } = req.body;
    db.prepare('UPDATE chatbot_configs SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(enabled ? 1 : 0, req.params.id);
    res.json({ success: true, message: `Chatbot ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
