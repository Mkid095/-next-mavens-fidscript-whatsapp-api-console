import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import db from '../../database.js';
import { evaluateTriggers } from '../../modules/ai/chatbotEngine.js';
import { validatePublish } from '../../modules/chatbot/validation/index.js';
import { runPublishPipeline } from '../../modules/chatbot/publishPipeline.js';

// Ensure chatbot_response_rules table exists (may not have been created by phase9 migration
// if DB was already past that version — safe to run on every startup via CREATE TABLE IF NOT EXISTS)
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

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

// ─── List chatbots for workspace ─────────────────────────────────────────────
router.get('/', (req: Request, res: Response) => {
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
});

// ─── Get single chatbot with full config ─────────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
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
});

// ─── Create chatbot ───────────────────────────────────────────────────────────
router.post('/', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const {
      instance_id, name, description = '', priority = 0,
      config_json = '{}', enabled = true,
    } = req.body;

    if (!instance_id || !name) {
      return res.status(400).json({ success: false, error: 'instance_id and name are required' });
    }

    // Verify instance belongs to workspace
    const instance = db.prepare(
      'SELECT id FROM instances WHERE id = ? AND client_id = ?'
    ).get(instance_id, workspaceId);
    if (!instance) {
      return res.status(400).json({ success: false, error: 'Invalid instance_id' });
    }

    const id = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_configs
      (id, workspace_id, instance_id, name, description, priority, config_json, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, workspaceId, instance_id, name, description, priority, config_json, enabled ? 1 : 0);

    // Auto-create AI config row
    db.prepare(
      'INSERT INTO chatbot_ai_configs (id, chatbot_id) VALUES (?, ?)'
    ).run(`aicfg_${Date.now()}`, id);

    // Auto-create response policy row
    db.prepare(
      'INSERT INTO chatbot_response_policies (id, chatbot_id) VALUES (?, ?)'
    ).run(`pol_${Date.now()}`, id);

    logAuditAction(req, 'CREATE', 'chatbot', id, `Created chatbot "${name}"`);
    res.status(201).json({ success: true, data: { id }, message: 'Chatbot created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Update chatbot ───────────────────────────────────────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { name, description, priority, config_json, enabled, instance_id } = req.body;
    if (instance_id) {
      const instance = db.prepare('SELECT id FROM instances WHERE id = ? AND client_id = ?').get(instance_id, workspaceId);
      if (!instance) return res.status(400).json({ success: false, error: 'Invalid instance_id' });
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
});

// ─── Delete chatbot ───────────────────────────────────────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
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
});

// ─── AI Config ────────────────────────────────────────────────────────────────
router.put('/:id/ai-config', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

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
});

// ─── Triggers ─────────────────────────────────────────────────────────────────
router.post('/:id/triggers', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { trigger_type, trigger_value = '', keyword_mode = 'contains', require_previous_bot_reply = 0, enabled = true, priority = 0 } = req.body;
    const id = `trig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_triggers (id, chatbot_id, trigger_type, trigger_value, keyword_mode, require_previous_bot_reply, enabled, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.params.id, trigger_type, trigger_value, keyword_mode, require_previous_bot_reply ? 1 : 0, enabled ? 1 : 0, priority);

    res.status(201).json({ success: true, data: { id }, message: 'Trigger created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/:id/triggers/:triggerId', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    db.prepare('DELETE FROM chatbot_triggers WHERE id = ? AND chatbot_id = ?').run(req.params.triggerId, req.params.id);
    res.json({ success: true, message: 'Trigger deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Response Rules ────────────────────────────────────────────────────────────
router.post('/:id/rules', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { name = '', conditions_json = '[]', action, action_config_json = '{}', priority = 0, enabled = true } = req.body;
    if (!action) return res.status(400).json({ success: false, error: 'action is required' });

    const id = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_response_rules (id, chatbot_id, name, conditions_json, action, action_config_json, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.params.id, name, conditions_json, action, action_config_json, priority, enabled ? 1 : 0);

    res.status(201).json({ success: true, data: { id }, message: 'Rule created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/:id/rules/:ruleId', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

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
});

router.delete('/:id/rules/:ruleId', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM chatbot_response_rules WHERE id = ? AND chatbot_id = ?').run(req.params.ruleId, req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Handoff Rules ─────────────────────────────────────────────────────────────
router.post('/:id/handoff-rules', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { name = '', conditions_json = '[]', target_team_id = '', target_team_name = '', priority = 0, enabled = true } = req.body;
    const id = `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_handoff_rules (id, chatbot_id, name, conditions_json, target_team_id, target_team_name, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.params.id, name, conditions_json, target_team_id, target_team_name, priority, enabled ? 1 : 0);

    res.status(201).json({ success: true, data: { id }, message: 'Handoff rule created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Response Policies ─────────────────────────────────────────────────────────
router.put('/:id/policies', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

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
});

// ─── Group Settings ────────────────────────────────────────────────────────────
router.post('/:id/group-settings', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { group_jid, respond_when_mentioned = true, respond_to_all = false, silence_on_bot_reply = true } = req.body;
    if (!group_jid) return res.status(400).json({ success: false, error: 'group_jid is required' });

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
});

// ─── Contact Assignments ───────────────────────────────────────────────────────
router.post('/:id/contacts/:contactId', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const id = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT OR IGNORE INTO chatbot_contact_assignments (id, chatbot_id, contact_id)
      VALUES (?, ?, ?)`
    ).run(id, req.params.id, req.params.contactId);

    res.status(201).json({ success: true, message: 'Contact assigned' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/:id/contacts/:contactId', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM chatbot_contact_assignments WHERE chatbot_id = ? AND contact_id = ?').run(req.params.id, req.params.contactId);
    res.json({ success: true, message: 'Contact unassigned' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Trigger Test ─────────────────────────────────────────────────────────────
router.post('/:id/test-trigger', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { message, contact_id, conversation_id } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'message is required' });

    const result = evaluateTriggers(req.params.id, message, {
      workspaceId, contactId: contact_id, conversationId: conversation_id,
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Toggle enabled ────────────────────────────────────────────────────────────
router.patch('/:id/toggle', (req: Request, res: Response) => {
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
});

// ─── Publish Pipeline ──────────────────────────────────────────────────────────

router.post('/:id/publish', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { draft_json } = req.body;
    if (!draft_json) {
      return res.status(400).json({ success: false, error: 'draft_json is required in request body' });
    }

    let draft: Record<string, unknown>;
    try {
      draft = JSON.parse(draft_json) as Record<string, unknown>;
    } catch {
      return res.status(400).json({ success: false, error: 'draft_json must be valid JSON' });
    }

    // Run publish gate validation
    const validation = validatePublish(draft as unknown as Parameters<typeof validatePublish>[0]);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    // Create job row
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_publish_jobs (id, chatbot_id, workspace_id, status, progress, current_step, message)
      VALUES (?, ?, ?, 'pending', 0, 'queued', 'Publish queued…')`
    ).run(jobId, req.params.id, workspaceId);

    // Fire and forget — pipeline updates the job row; frontend polls for status
    runPublishPipeline(req.params.id, workspaceId, draft as unknown as Parameters<typeof runPublishPipeline>[2], jobId);

    logAuditAction(req, 'UPDATE', 'chatbot', req.params.id, `Published chatbot "${bot.name as string}"`);
    res.json({ success: true, data: { jobId }, message: 'Publish started' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Publish Job Status ────────────────────────────────────────────────────────

router.get('/:id/publish-job', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    // Find most recent job for this chatbot
    const row = db.prepare(
      'SELECT * FROM chatbot_publish_jobs WHERE chatbot_id = ? AND workspace_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.id, workspaceId);
    if (!row) { res.status(404).json({ success: false, error: 'No publish job found' }); return; }
    res.json({ success: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────────

router.get('/:id/health', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const knowledge = db.prepare(
      "SELECT COUNT(*) as cnt FROM chatbot_knowledge WHERE chatbot_id = ? AND status = 'active'"
    ).get(req.params.id) as { cnt: number } | undefined;

    const tools = db.prepare(
      'SELECT COUNT(*) as cnt FROM chatbot_tools WHERE chatbot_id = ? AND enabled = 1'
    ).get(req.params.id) as { cnt: number } | undefined;

    const triggers = db.prepare(
      'SELECT COUNT(*) as cnt FROM chatbot_triggers WHERE chatbot_id = ? AND enabled = 1'
    ).get(req.params.id) as { cnt: number } | undefined;

    const lastTest = db.prepare(
      'SELECT created_at FROM chatbot_test_sessions WHERE chatbot_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.id) as { created_at: string } | undefined;

    const aiConfig = db.prepare(
      'SELECT provider, model FROM chatbot_ai_configs WHERE chatbot_id = ? LIMIT 1'
    ).get(req.params.id) as { provider: string; model: string } | undefined;

    res.json({
      success: true,
      data: {
        status: (bot as { enabled: number }).enabled ? 'healthy' : 'disabled',
        provider: aiConfig?.provider ?? 'not configured',
        model: aiConfig?.model ?? null,
        knowledge: knowledge?.cnt ?? 0,
        tools: tools?.cnt ?? 0,
        triggers: triggers?.cnt ?? 0,
        last_test: lastTest?.created_at ?? null,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Test Configuration ────────────────────────────────────────────────────────

router.post('/:id/test-config', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { draft_json } = req.body;
    if (!draft_json) {
      return res.status(400).json({ success: false, error: 'draft_json is required' });
    }

    let draft: Record<string, unknown>;
    try {
      draft = JSON.parse(draft_json) as Record<string, unknown>;
    } catch {
      return res.status(400).json({ success: false, error: 'draft_json must be valid JSON' });
    }

    const validation = validatePublish(draft as unknown as Parameters<typeof validatePublish>[0]);

    const checks = {
      provider: { ok: true, message: '' as string },
      knowledge: { ok: true, message: '' as string },
      tools: { ok: true, message: '' as string },
    };

    // Check knowledge sources in error state
    const knowledge = draft.knowledge as { sources: Array<{ name: string; status: string }> } | undefined;
    const errorSources = knowledge?.sources?.filter(s => s.status === 'error') ?? [];
    if (errorSources.length > 0) {
      checks.knowledge = { ok: false, message: `${errorSources.length} source(s) in error state` };
    }

    // Check tools
    const tools = draft.tools as { tools: Array<{ name: string; type: string; config: Record<string, unknown> }> } | undefined;
    const badTools = tools?.tools?.filter(t => {
      if (!t.name) return true;
      if ((t.type === 'http-request' || t.type === 'webhook')) {
        const url = t.config?.url as string | undefined;
        return url && !url.startsWith('http');
      }
      return false;
    }) ?? [];
    if (badTools.length > 0) {
      checks.tools = { ok: false, message: `${badTools.length} tool(s) with invalid URL` };
    }

    res.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        checks,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Version History ───────────────────────────────────────────────────────────

router.get('/:id/versions', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const versions = db.prepare(
      'SELECT * FROM chatbot_versions WHERE chatbot_id = ? ORDER BY version DESC'
    ).all(req.params.id);

    res.json({ success: true, data: versions });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Rollback ─────────────────────────────────────────────────────────────────

router.post('/:id/rollback', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId) as { id: string; name: string } | undefined;
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { version_id } = req.body;
    if (!version_id) {
      return res.status(400).json({ success: false, error: 'version_id is required' });
    }

    const version = db.prepare(
      'SELECT * FROM chatbot_versions WHERE id = ? AND chatbot_id = ?'
    ).get(version_id, req.params.id) as { config_snapshot_json: string } | undefined;
    if (!version) { res.status(404).json({ success: false, error: 'Version not found' }); return; }

    // Restore config_json from the snapshot
    db.prepare(`UPDATE chatbot_configs SET
      config_json = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(version.config_snapshot_json, req.params.id);

    logAuditAction(req, 'UPDATE', 'chatbot', req.params.id, `Rolled back to version ${version_id}`);
    res.json({ success: true, message: 'Rolled back to previous version' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Duplicate Chatbot ─────────────────────────────────────────────────────────

router.post('/:id/duplicate', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId) as { name: string; description: string; config_json: string; instance_id: string; priority: number } | undefined;
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const newId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newName = `${bot.name} (Copy)`;

    db.prepare(`INSERT INTO chatbot_configs (id, workspace_id, instance_id, name, description, priority, config_json, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(newId, workspaceId, bot.instance_id, newName, bot.description, bot.priority, bot.config_json);

    // Auto-create AI config and policy rows for the new bot
    db.prepare('INSERT INTO chatbot_ai_configs (id, chatbot_id) VALUES (?, ?)').run(`aicfg_${Date.now()}`, newId);
    db.prepare('INSERT INTO chatbot_response_policies (id, chatbot_id) VALUES (?, ?)').run(`pol_${Date.now()}`, newId);

    logAuditAction(req, 'CREATE', 'chatbot', newId, `Duplicated chatbot from ${req.params.id}`);
    res.status(201).json({ success: true, data: { id: newId }, message: 'Chatbot duplicated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Token Forecast ─────────────────────────────────────────────────────────────

router.get('/:id/token-forecast', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const remainingDays = daysInMonth - dayOfMonth;

    // Current month totals
    const monthRow = db.prepare(`
      SELECT
        COALESCE(SUM(prompt_tokens), 0) as input_tokens,
        COALESCE(SUM(completion_tokens), 0) as output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as cost_usd
      FROM chatbot_token_usage
      WHERE chatbot_id = ? AND period_start >= ?
    `).get(req.params.id, startOfMonth) as { input_tokens: number; output_tokens: number; total_tokens: number; cost_usd: number } | undefined;

    const inputTokens = monthRow?.input_tokens ?? 0;
    const outputTokens = monthRow?.output_tokens ?? 0;
    const totalTokens = monthRow?.total_tokens ?? 0;
    const costCents = Math.round((monthRow?.cost_usd ?? 0) * 100);

    // Daily average (for forecasting)
    const dailyAvg = dayOfMonth > 0
      ? { inputTokens: Math.round(inputTokens / dayOfMonth), outputTokens: Math.round(outputTokens / dayOfMonth) }
      : { inputTokens: 0, outputTokens: 0 };

    const forecastInput = Math.round(dailyAvg.inputTokens * daysInMonth);
    const forecastOutput = Math.round(dailyAvg.outputTokens * daysInMonth);
    const forecastCost = Math.round((forecastInput * 0.001 + forecastOutput * 0.002) * 100); // $0.001/1K input, $0.002/1K output

    res.json({
      success: true,
      data: {
        currentMonth: { inputTokens, outputTokens, totalTokens, costCents },
        forecastMonth: {
          inputTokens: forecastInput,
          outputTokens: forecastOutput,
          costCents: forecastCost,
        },
        dailyAverage: dailyAvg,
        remainingDays,
        daysInMonth,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Runtime Traces ─────────────────────────────────────────────────────────────

router.get('/:id/traces', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { conversationId, limit = '50' } = req.query;
    const limitNum = Math.min(Number(limit), 200);

    let rows: Record<string, unknown>[];
    if (conversationId) {
      rows = db.prepare(`
        SELECT * FROM chatbot_traces
        WHERE chatbot_id = ? AND conversation_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(req.params.id, conversationId, limitNum);
    } else {
      rows = db.prepare(`
        SELECT * FROM chatbot_traces
        WHERE chatbot_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(req.params.id, limitNum);
    }

    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Tools attached to this chatbot ────────────────────────────────────────

router.get('/:id/tools', (req: Request, res: Response) => {
  const bot = db.prepare('SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }
  const rows = db.prepare(`
    SELECT t.id, t.name, t.description, t.implementation, t.parameters_json,
           t.enabled AS tool_enabled, ct.enabled AS attached_enabled,
           ds.id AS data_source_id, ds.name AS data_source_name
    FROM chatbot_tools ct
    JOIN tools t ON t.id = ct.tool_id
    JOIN data_sources ds ON ds.id = t.data_source_id
    WHERE ct.chatbot_id = ? AND ds.workspace_id = ?
    ORDER BY t.name ASC
  `).all(req.params.id, wsId(req));
  res.json({ success: true, data: rows });
});

router.post('/:id/tools', (req: Request, res: Response) => {
  const bot = db.prepare('SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }
  const ids = (req.body as { tool_ids?: string[] }).tool_ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'tool_ids[] is required' });
  }
  // Verify every tool belongs to this workspace
  const placeholders = ids.map(() => '?').join(',');
  const params: string[] = [...ids, wsId(req)];
  const valid = db.prepare(
    `SELECT id FROM tools WHERE id IN (${placeholders}) AND data_source_id IN (SELECT id FROM data_sources WHERE workspace_id = ?)`
  ).all(...params);
  if (valid.length !== ids.length) {
    return res.status(400).json({ success: false, error: 'One or more tool_ids are not in this workspace' });
  }
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO chatbot_tools (chatbot_id, tool_id) VALUES (?, ?)
  `);
  for (const id of ids) stmt.run(req.params.id, id);
  res.json({ success: true, message: `${ids.length} tool(s) attached` });
});

router.delete('/:id/tools/:toolId', (req: Request, res: Response) => {
  const result = db.prepare(`
    DELETE FROM chatbot_tools WHERE chatbot_id = ? AND tool_id = ?
      AND chatbot_id IN (SELECT id FROM chatbot_configs WHERE workspace_id = ?)
  `).run(req.params.id, req.params.toolId, wsId(req));
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Tool not attached' }); return; }
  res.json({ success: true, message: 'Tool detached' });
});

// ─── Inspector: list conversations for a chatbot ─────────────────────────────────

router.get('/:id/conversations', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { q, lowConfidence, escalated } = req.query as Record<string, string>;

    // Conversations for this chatbot = distinct conversation_ids from
    // chatbot_response_metadata rows that belong to this chatbot
    let sql = `
      SELECT
        im.conversation_id,
        c.display_name  AS customer_name,
        c.phone         AS customer_number,
        im.content      AS last_message,
        im.timestamp    AS last_message_at,
        COUNT(*)        AS message_count,
        SUM(CASE WHEN im.is_read = 0 AND im.direction = 'incoming' THEN 1 ELSE 0 END) AS unread_count,
        MAX(crm.confidence) AS max_confidence,
        MAX(CASE WHEN crm.skip_reason IS NOT NULL THEN 1 ELSE 0 END) AS has_skip_reason
      FROM chatbot_response_metadata crm
      JOIN inbox_messages im ON im.id = crm.message_id
      LEFT JOIN customers c ON c.id = im.customer_id
      WHERE crm.chatbot_id = ?
    `;
    const params: unknown[] = [req.params.id];

    if (q) {
      sql += ' AND (c.display_name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ' GROUP BY im.conversation_id ORDER BY im.timestamp DESC LIMIT 100';

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

    const conversations = rows.map(r => ({
      conversationId: r.conversation_id,
      customerName: r.customer_name ?? 'Unknown',
      customerNumber: r.customer_number ?? '',
      lastMessage: r.last_message ?? '',
      lastMessageAt: r.last_message_at,
      messageCount: r.message_count,
      unreadCount: r.unread_count,
      lowConfidence: Number(r.max_confidence) < 0.5,
      wasEscalated: r.has_skip_reason === 1,
    }));

    // Apply filters that need post-processing
    let filtered = conversations;
    if (lowConfidence === '1') filtered = filtered.filter(c => c.lowConfidence);
    if (escalated === '1')    filtered = filtered.filter(c => c.wasEscalated);

    res.json({ success: true, data: filtered });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Inspector: replay a customer message in simulation mode ─────────────────────

router.post('/:id/replay', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { messageId } = req.body as { messageId?: string };
    if (!messageId) { res.status(400).json({ success: false, error: 'messageId is required' }); return; }

    // Load the customer message to replay
    const msg = db.prepare(
      'SELECT content FROM inbox_messages WHERE id = ? AND workspace_id = ?'
    ).get(messageId, workspaceId) as { content: string } | undefined;
    if (!msg) { res.status(404).json({ success: false, error: 'Message not found' }); return; }

    // Load prior conversation context (last 20 messages)
    const conversationId = db.prepare(
      'SELECT conversation_id FROM inbox_messages WHERE id = ?'
    ).get(messageId) as { conversation_id: string } | undefined;
    const historyMessages = conversationId
      ? (db.prepare(`
          SELECT content, direction FROM inbox_messages
          WHERE conversation_id = ? AND id != ?
          ORDER BY timestamp DESC LIMIT 20
        `).all(conversationId.conversation_id, messageId) as { content: string; direction: string }[])
      : [];

    // Run trigger evaluation in simulation mode
    const evalResult = evaluateTriggers(req.params.id, msg.content, {
      workspaceId,
      conversationId: conversationId?.conversation_id,
      mode: 'simulation',
    });

    // Return what would happen — no actual LLM call in V1
    res.json({
      success: true,
      data: {
        matchedTrigger: evalResult.trigger.triggerId ?? null,
        matchedRule: evalResult.rule.ruleName ?? null,
        confidence: evalResult.trigger.confidence,
        shouldRespond: evalResult.shouldRespond,
        skipReason: evalResult.skipReason ?? null,
        // historyMessages available for future LLM simulation
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;