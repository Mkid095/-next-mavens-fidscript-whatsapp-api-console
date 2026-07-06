/**
 * Admin Chatbot Analytics — /api/admin/chatbot-analytics
 *
 * Cross-workspace aggregates for admin dashboards. NOT the per-workspace
 * chatbot CRUD (which lives under /api/platform/chatbots).
 */
import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import db from '../../database.js';

const router = Router();
router.use(adminAuth);

/**
 * GET /api/admin/chatbot-analytics
 * Returns:
 *   - totals (chatbots / enabled / traces-this-week / tokens-this-week)
 *   - per-client breakdown (top workspaces by chatbot count + token usage)
 *   - per-LLM-provider breakdown (which providers are most-used via chatbots)
 *   - response-type breakdown (what message types bots have been sending)
 *   - recent activity (last 10 chatbot traces)
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

    // Top-of-funnel totals
    const totals = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM chatbot_configs) AS chatbots_total,
        (SELECT COUNT(*) FROM chatbot_configs WHERE enabled = 1) AS chatbots_enabled,
        (SELECT COUNT(*) FROM llm_connections WHERE enabled = 1) AS llm_connections_active,
        (SELECT COUNT(DISTINCT workspace_id) FROM chatbot_configs) AS workspaces_with_chatbots,
        (SELECT COALESCE(SUM(total_tokens), 0) FROM chatbot_token_usage WHERE period_start >= ?) AS tokens_this_week,
        (SELECT COUNT(*) FROM chatbot_traces WHERE created_at >= ?) AS traces_this_week
    `).get(weekAgo, weekAgo);

    // Per-client breakdown (top 10 by chatbot count)
    const perClient = db.prepare(`
      SELECT
        c.id            AS client_id,
        c.name          AS client_name,
        c.email,
        c.plan_id,
        COUNT(cc.id)    AS chatbot_count,
        SUM(CASE WHEN cc.enabled = 1 THEN 1 ELSE 0 END) AS enabled_count,
        COALESCE((
          SELECT SUM(ctu.total_tokens) FROM chatbot_token_usage ctu
          WHERE ctu.chatbot_id IN (SELECT id FROM chatbot_configs WHERE workspace_id = c.id)
            AND ctu.period_start >= ?
        ), 0) AS tokens_this_week
      FROM clients c
      LEFT JOIN chatbot_configs cc ON cc.workspace_id = c.id
      GROUP BY c.id
      HAVING chatbot_count > 0
      ORDER BY chatbot_count DESC, tokens_this_week DESC
      LIMIT 10
    `).all(weekAgo);

    // Per-LLM-provider breakdown (which providers workspaces are using)
    const perProvider = db.prepare(`
      SELECT
        cai.provider,
        cai.model,
        COUNT(DISTINCT cc.id)         AS chatbot_count,
        COUNT(DISTINCT cc.workspace_id) AS workspace_count
      FROM chatbot_ai_configs cai
      JOIN chatbot_configs cc ON cc.id = cai.chatbot_id
      WHERE cai.provider IS NOT NULL AND cai.provider <> ''
      GROUP BY cai.provider, cai.model
      ORDER BY chatbot_count DESC
      LIMIT 20
    `).all();

    // Response-type breakdown — what message types bots are sending
    // (we approximate via the trigger_type since each trigger implies a response shape)
    const responseTypes = db.prepare(`
      SELECT
        trigger_type AS type,
        COUNT(*)     AS count
      FROM chatbot_triggers
      WHERE enabled = 1
      GROUP BY trigger_type
      ORDER BY count DESC
    `).all();

    // Hallucination-policy breakdown
    const hallucinationPolicies = db.prepare(`
      SELECT
        COALESCE(hallucination_policy, 'unset') AS policy,
        COUNT(*)                              AS count
      FROM chatbot_ai_configs
      GROUP BY hallucination_policy
      ORDER BY count DESC
    `).all();

    // Recent traces (last 10)
    const recentTraces = db.prepare(`
      SELECT
        ct.id, ct.chatbot_id, cc.name AS chatbot_name,
        ct.conversation_id, ct.prompt, ct.response,
        ct.input_tokens, ct.output_tokens, ct.total_tokens,
        ct.cost_usd, ct.model, ct.provider, ct.created_at
      FROM chatbot_traces ct
      LEFT JOIN chatbot_configs cc ON cc.id = ct.chatbot_id
      ORDER BY ct.created_at DESC
      LIMIT 10
    `).all();

    // Confidence thresholds (helps admins see if bots are calibrated)
    const confidenceThresholds = db.prepare(`
      SELECT
        cp.chatbot_id,
        cc.name AS chatbot_name,
        cp.confidence_threshold,
        cp.escalate_on_low_confidence,
        cp.fallback_reply
      FROM chatbot_response_policies cp
      JOIN chatbot_configs cc ON cc.id = cp.chatbot_id
      ORDER BY cp.confidence_threshold ASC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      data: {
        totals,
        perClient,
        perProvider,
        responseTypes,
        hallucinationPolicies,
        confidenceThresholds,
        recentTraces,
        as_of: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;