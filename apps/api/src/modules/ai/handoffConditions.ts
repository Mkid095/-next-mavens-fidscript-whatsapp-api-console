/**
 * Human Handoff — condition evaluation.
 * Evaluates handoff rules for a chatbot and message.
 */
import db from '../../database.js';
import { evaluateConditions, type EvaluationContext } from './conditionEvaluator.js';

/**
 * Evaluate handoff rules for a chatbot and message.
 * Returns the first matching rule's target, or null.
 */
export function evaluateHandoffRules(
  chatbotId: string,
  ctx: { contactId?: string; conversationId?: string; workspaceId: string; message?: string }
): { shouldHandoff: boolean; targetTeamId?: string; targetTeamName?: string } {
  const rules = db.prepare(`
    SELECT * FROM chatbot_handoff_rules
    WHERE chatbot_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(chatbotId) as Array<{
    id: string;
    name: string;
    conditions_json: string;
    target_team_id: string;
    target_team_name: string;
  }>;

  const evalCtx: EvaluationContext = {
    workspaceId: ctx.workspaceId,
    contactId: ctx.contactId,
    conversationId: ctx.conversationId,
  };

  for (const rule of rules) {
    const matched = evaluateConditions(rule.conditions_json, evalCtx);
    if (matched) {
      return { shouldHandoff: true, targetTeamId: rule.target_team_id, targetTeamName: rule.target_team_name };
    }
  }

  return { shouldHandoff: false };
}
