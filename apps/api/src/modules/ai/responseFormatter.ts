/**
 * responseFormatter.ts — rule engine + action resolution.
 *
 * Evaluates chatbot_response_rules against an EvaluationContext
 * and returns a RuleResult with the resolved action.
 */

import db from '../../database.js';
import { safeJsonParse } from './chatbotUtils.js';
import { evaluateConditions, type EvaluationContext } from './conditionEvaluator.js';

export interface RuleResult {
  matched: boolean;
  ruleId?: string;
  ruleName?: string;
  action: 'ai' | 'manual' | 'skip' | 'workflow';
  actionConfig: Record<string, unknown>;
  conditionsJson?: string;
}

// ─── Rule Engine ──────────────────────────────────────────────────────────────

export function evaluateRules(
  botId: string,
  ctx: EvaluationContext
): RuleResult {
  const rules = db.prepare(`
    SELECT * FROM chatbot_response_rules
    WHERE chatbot_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(botId) as Record<string, unknown>[];

  for (const rule of rules) {
    const conditionsJson = String(rule.conditions_json ?? '[]');
    const matched = evaluateConditions(conditionsJson, ctx);
    if (matched) {
      return {
        matched: true,
        ruleId: String(rule.id),
        ruleName: String(rule.name),
        action: String(rule.action) as RuleResult['action'],
        actionConfig: safeJsonParse(String(rule.action_config_json ?? '{}')) as Record<string, unknown>,
        conditionsJson,
      };
    }
  }

  // Default: if triggers matched but no rule, fall back to AI
  return { matched: false, action: 'ai', actionConfig: {}, conditionsJson: '[]' };
}
