/**
 * Token Billing Enforcement
 *
 * Tracks AI interaction units per workspace plan.
 * Plans: Starter (5,000 units), Growth (50,000), Business (250,000), Enterprise (custom).
 *
 * Per spec:
 *   AI reply       = 10 units
 *   Dataset search = 2 units
 *   Tool call      = 2 units
 *   Memory save    = 1 unit
 *   Knowledge search = 1 unit
 */
import db, { saveDatabase } from '../../database.js';

const PLAN_LIMITS: Record<string, number> = {
  starter:    5_000,
  growth:    50_000,
  business:  250_000,
  enterprise: 10_000_000, // effectively unlimited
};

export interface BillingRecord {
  workspaceId: string;
  periodStart: string;
  totalUnits: number;
  planLimit: number;
  remaining: number;
  isOverLimit: boolean;
}

/**
 * Check if a workspace can afford an action. Returns true if within limit.
 */
export function canUseUnits(workspaceId: string, unitsNeeded: number): boolean {
  const remaining = getRemainingUnits(workspaceId);
  return remaining >= unitsNeeded;
}

/**
 * Get remaining AI units for a workspace this period.
 */
export function getRemainingUnits(workspaceId: string): number {
  const limit = getWorkspacePlanLimit(workspaceId);
  const used = getTotalUnitsUsed(workspaceId);
  return Math.max(0, limit - used);
}

function getTotalUnitsUsed(workspaceId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(cost_units), 0) as total
    FROM chatbot_token_usage ctu
    JOIN chatbot_configs cc ON cc.id = ctu.chatbot_id
    WHERE cc.workspace_id = ?
      AND ctu.created_at >= datetime('now', '-30 days')
  `).get(workspaceId) as { total: number } | undefined;
  return row?.total ?? 0;
}

function getWorkspacePlanLimit(workspaceId: string): number {
  const client = db.prepare(
    'SELECT plan FROM clients WHERE id = ?'
  ).get(workspaceId) as { plan: string } | undefined;
  return PLAN_LIMITS[client?.plan ?? 'starter'] ?? PLAN_LIMITS['starter'];
}

/**
 * Deduct units after a chatbot turn. Returns false if over limit.
 */
export function deductUnits(
  workspaceId: string,
  conversationId: string,
  items: Array<{
    action: 'ai_reply' | 'dataset_search' | 'tool_call' | 'memory_save' | 'knowledge_search';
    tokensUsed?: number;
  }>
): { success: boolean; totalUnits: number; remaining: number } {
  const totalUnits = items.reduce((sum, item) => {
    return sum + computeUnits(item.action, item.tokensUsed);
  }, 0);

  if (!canUseUnits(workspaceId, totalUnits)) {
    return { success: false, totalUnits, remaining: getRemainingUnits(workspaceId) };
  }

  for (const item of items) {
    const units = computeUnits(item.action, item.tokensUsed);
    const id = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_token_usage
      (id, chatbot_id, conversation_id, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, cost_units, period_start, created_at)
      VALUES (?, '', ?, '', 0, 0, ?, 0, ?, datetime('now'), datetime('now'))`
    ).run(id, conversationId, item.tokensUsed ?? 0, units);
  }

  saveDatabase();
  return { success: true, totalUnits, remaining: getRemainingUnits(workspaceId) };
}

function computeUnits(action: string, tokensUsed?: number): number {
  switch (action) {
    case 'ai_reply':        return 10;
    case 'dataset_search':  return 2;
    case 'tool_call':       return 2;
    case 'memory_save':      return 1;
    case 'knowledge_search': return 1;
    default:                return 1;
  }
}

/**
 * Get billing summary for a workspace.
 */
export function getBillingSummary(workspaceId: string): BillingRecord {
  const limit = getWorkspacePlanLimit(workspaceId);
  const used = getTotalUnitsUsed(workspaceId);
  return {
    workspaceId,
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalUnits: used,
    planLimit: limit,
    remaining: Math.max(0, limit - used),
    isOverLimit: used >= limit,
  };
}
