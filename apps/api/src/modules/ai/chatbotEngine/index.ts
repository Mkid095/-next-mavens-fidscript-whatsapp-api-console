/**
 * chatbotEngine/ — trigger evaluation + rule engine.
 *
 * Exported from chatbotEngineImpl.ts (the main engine):
 *   evaluateTriggers()
 *   evaluateConditions()
 *   findBotsForMessage()
 *   pickBestBot()
 *   type TriggerResult, RuleResult, EvaluationContext, EvaluationResult
 *
 * triggerEvaluator.ts (trigger matching helpers):
 *   matchKeyword()
 *
 * responseFormatter.ts (response formatting):
 *   formatBotResponse()
 */
export type {
  TriggerResult,
  RuleResult,
  EvaluationContext,
  EvaluationResult,
  ExecutionMode,
  GroupRespondMode,
} from './chatbotEngineImpl.js';

export {
  evaluateTriggers,
  evaluateConditions,
  findBotsForMessage,
  pickBestBot,
} from './chatbotEngineImpl.js';
