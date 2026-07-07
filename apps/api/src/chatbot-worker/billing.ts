/**
 * Token billing + usage tracking.
 * Costs are read from the database via pricingService (token_action_costs table).
 */
import db, { saveDatabase } from '../database.js';
import { getCost } from '../services/pricingService.js';

const ACTION_MAP: Record<string, string> = {
  ai_reply:          'ai.reply',
  dataset_search:    'ai.dataset_search',
  tool_call:         'ai.tool_call',
  memory_save:       'ai.memory_save',
  knowledge_search:  'ai.knowledge_search',
};

export function computeCostUnits(
  action: 'ai_reply' | 'dataset_search' | 'tool_call' | 'memory_save' | 'knowledge_search'
): number {
  const costAction = ACTION_MAP[action] ?? action;
  return getCost(costAction);
}

export function logTokenUsage(
  chatbotId: string,
  conversationId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  costUsd = 0,
  costUnits = 10
): void {
  try {
    const id = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Look up workspace_id from the chatbot config
    const bot = db.prepare(
      'SELECT workspace_id FROM chatbot_configs WHERE id = ?'
    ).get(chatbotId) as { workspace_id: string } | undefined;

    db.prepare(`INSERT INTO chatbot_token_usage
      (id, chatbot_id, conversation_id, workspace_id, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, cost_units, period_start, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      chatbotId,
      conversationId,
      bot?.workspace_id ?? '',
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      costUnits
    );
    saveDatabase();
  } catch (_) { /* non-fatal */ }
}

/**
 * Get total cost units consumed by a chatbot in the current billing period.
 */
export function getChatbotUsageThisPeriod(chatbotId: string): {
  totalUnits: number;
  totalTokens: number;
  totalCostUsd: number;
} {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(cost_units), 0) as total_units,
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(cost_usd), 0) as total_cost_usd
    FROM chatbot_token_usage
    WHERE chatbot_id = ?
      AND period_start >= datetime('now', '-30 days')
  `).get(chatbotId) as { total_units: number; total_tokens: number; total_cost_usd: number } | undefined;

  return {
    totalUnits: row?.total_units ?? 0,
    totalTokens: row?.total_tokens ?? 0,
    totalCostUsd: row?.total_cost_usd ?? 0,
  };
}
