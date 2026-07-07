/**
 * chatbotEngine/ — forwarding re-export from kernel/automation/chatbotEngine/.
 */
export type {
  TriggerResult,
  RuleResult,
  EvaluationContext,
  EvaluationResult,
  ExecutionMode,
  GroupRespondMode,
} from '../../../kernel/automation/chatbotEngine/index.js';

export {
  evaluateTriggers,
  evaluateConditions,
  findBotsForMessage,
  pickBestBot,
  matchKeyword,
} from '../../../kernel/automation/chatbotEngine/index.js';
