/**
 * Chatbot Inspect Handlers — health, test-config, versions, rollback, duplicate,
 * token-forecast, tools, inspector conversations, and replay.
 */

import type { Request, Response } from 'express';
import db from '../../database.js';
import { wsId } from './chatbotCrudHandlers.js';
import { validatePublish } from '../../modules/chatbot/validation/index.js';
import { evaluateTriggers } from '../../modules/ai/chatbotEngine.js';
import { logAuditAction } from '../../utils/audit.js';

export { wsId };

// ─── Health Check ──────────────────────────────────────────────────────────────
export function healthCheck(req: Request, res: Response): void {
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
}

// ─── Test Configuration ────────────────────────────────────────────────────────
export function testConfig(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { draft_json } = req.body;
    if (!draft_json) {
      res.status(400).json({ success: false, error: 'draft_json is required' });
      return;
    }

    let draft: Record<string, unknown>;
    try {
      draft = JSON.parse(draft_json) as Record<string, unknown>;
    } catch {
      res.status(400).json({ success: false, error: 'draft_json must be valid JSON' });
      return;
    }

    const validation = validatePublish(draft as unknown as Parameters<typeof validatePublish>[0]);

    const checks = {
      provider: { ok: true, message: '' as string },
      knowledge: { ok: true, message: '' as string },
      tools: { ok: true, message: '' as string },
    };

    const knowledge = draft.knowledge as { sources: Array<{ name: string; status: string }> } | undefined;
    const errorSources = knowledge?.sources?.filter(s => s.status === 'error') ?? [];
    if (errorSources.length > 0) {
      checks.knowledge = { ok: false, message: `${errorSources.length} source(s) in error state` };
    }

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
}

// ─── Version History ───────────────────────────────────────────────────────────
export function getVersions(req: Request, res: Response): void {
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
}

// ─── Rollback ──────────────────────────────────────────────────────────────────
export function rollbackChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId) as { id: string; name: string } | undefined;
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { version_id } = req.body;
    if (!version_id) {
      res.status(400).json({ success: false, error: 'version_id is required' });
      return;
    }

    const version = db.prepare(
      'SELECT * FROM chatbot_versions WHERE id = ? AND chatbot_id = ?'
    ).get(version_id, req.params.id) as { config_snapshot_json: string } | undefined;
    if (!version) { res.status(404).json({ success: false, error: 'Version not found' }); return; }

    db.prepare(`UPDATE chatbot_configs SET config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(version.config_snapshot_json, req.params.id);

    logAuditAction(req, 'UPDATE', 'chatbot', req.params.id, `Rolled back to version ${version_id}`);
    res.json({ success: true, message: 'Rolled back to previous version' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Duplicate Chatbot ─────────────────────────────────────────────────────────
export function duplicateChatbot(req: Request, res: Response): void {
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

    db.prepare('INSERT INTO chatbot_ai_configs (id, chatbot_id) VALUES (?, ?)').run(`aicfg_${Date.now()}`, newId);
    db.prepare('INSERT INTO chatbot_response_policies (id, chatbot_id) VALUES (?, ?)').run(`pol_${Date.now()}`, newId);

    logAuditAction(req, 'CREATE', 'chatbot', newId, `Duplicated chatbot from ${req.params.id}`);
    res.status(201).json({ success: true, data: { id: newId }, message: 'Chatbot duplicated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Token Forecast ─────────────────────────────────────────────────────────────
export function tokenForecast(req: Request, res: Response): void {
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

    const dailyAvg = dayOfMonth > 0
      ? { inputTokens: Math.round(inputTokens / dayOfMonth), outputTokens: Math.round(outputTokens / dayOfMonth) }
      : { inputTokens: 0, outputTokens: 0 };

    const forecastInput = Math.round(dailyAvg.inputTokens * daysInMonth);
    const forecastOutput = Math.round(dailyAvg.outputTokens * daysInMonth);
    const forecastCost = Math.round((forecastInput * 0.001 + forecastOutput * 0.002) * 100);

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
}

// ─── Tools ──────────────────────────────────────────────────────────────────────
export function getTools(req: Request, res: Response): void {
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
}

export function attachTools(req: Request, res: Response): void {
  const bot = db.prepare('SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }
  const ids = (req.body as { tool_ids?: string[] }).tool_ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: 'tool_ids[] is required' });
    return;
  }
  const placeholders = ids.map(() => '?').join(',');
  const params: string[] = [...ids, wsId(req)];
  const valid = db.prepare(
    `SELECT id FROM tools WHERE id IN (${placeholders}) AND data_source_id IN (SELECT id FROM data_sources WHERE workspace_id = ?)`
  ).all(...params);
  if (valid.length !== ids.length) {
    res.status(400).json({ success: false, error: 'One or more tool_ids are not in this workspace' });
    return;
  }
  const stmt = db.prepare(`INSERT OR IGNORE INTO chatbot_tools (chatbot_id, tool_id) VALUES (?, ?)`);
  for (const id of ids) stmt.run(req.params.id, id);
  res.json({ success: true, message: `${ids.length} tool(s) attached` });
}

export function detachTool(req: Request, res: Response): void {
  const result = db.prepare(`
    DELETE FROM chatbot_tools WHERE chatbot_id = ? AND tool_id = ?
      AND chatbot_id IN (SELECT id FROM chatbot_configs WHERE workspace_id = ?)
  `).run(req.params.id, req.params.toolId, wsId(req));
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Tool not attached' }); return; }
  res.json({ success: true, message: 'Tool detached' });
}

// ─── Inspector: list conversations ─────────────────────────────────────────────
export function getInspectorConversations(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { q, lowConfidence, escalated } = req.query as Record<string, string>;

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

    let filtered = conversations;
    if (lowConfidence === '1') filtered = filtered.filter(c => c.lowConfidence);
    if (escalated === '1')    filtered = filtered.filter(c => c.wasEscalated);

    res.json({ success: true, data: filtered });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Inspector: replay ─────────────────────────────────────────────────────────
export function replayChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { messageId } = req.body as { messageId?: string };
    if (!messageId) { res.status(400).json({ success: false, error: 'messageId is required' }); return; }

    const msg = db.prepare(
      'SELECT content FROM inbox_messages WHERE id = ? AND workspace_id = ?'
    ).get(messageId, workspaceId) as { content: string } | undefined;
    if (!msg) { res.status(404).json({ success: false, error: 'Message not found' }); return; }

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

    const evalResult = evaluateTriggers(req.params.id, msg.content, {
      workspaceId,
      conversationId: conversationId?.conversation_id,
      mode: 'simulation',
    });

    res.json({
      success: true,
      data: {
        matchedTrigger: evalResult.trigger.triggerId ?? null,
        matchedRule: evalResult.rule.ruleName ?? null,
        confidence: evalResult.trigger.confidence,
        shouldRespond: evalResult.shouldRespond,
        skipReason: evalResult.skipReason ?? null,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
