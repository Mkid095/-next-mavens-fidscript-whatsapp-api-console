/**
 * Token billing + usage tracking.
 * Per spec: AI reply = 10 units, dataset_search = 2, tool_call = 2,
 * memory_save = 1, knowledge_search = 1.
 */
import db, { saveDatabase } from '../database.js';

export function computeCostUnits(
  action: 'ai_reply' | 'dataset_search' | 'tool_call' | 'memory_save' | 'knowledge_search'
): number {
  switch (action) {
    case 'ai_reply':        return 10;
    case 'dataset_search':  return 2;
    case 'tool_call':       return 2;
    case 'memory_save':     return 1;
    case 'knowledge_search': return 1;
  }
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
    db.prepare(`INSERT INTO chatbot_token_usage
      (id, chatbot_id, conversation_id, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, cost_units, period_start, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, chatbotId, conversationId, model, promptTokens, completionTokens, totalTokens, costUsd, costUnits);
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
