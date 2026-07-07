/**
 * chatbotEngine/ — trigger evaluation + rule engine.
 *
 * Exports:
 *   evaluateTriggers, evaluateConditions, findBotsForMessage, pickBestBot
 *   type TriggerResult, RuleResult, EvaluationContext, EvaluationResult
 *   matchKeyword (trigger matching helper)
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
  matchKeyword,
} from './chatbotEngineImpl.js';
