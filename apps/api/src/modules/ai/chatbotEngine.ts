/**
 * chatbotEngine.ts — thin re-export barrel.
 *
 * All logic moved to chatbotEngine/:
 *   chatbotEngineImpl.ts  — main engine
 *   triggerEvaluator.ts   — trigger matching helpers
 *   responseFormatter.ts  — response formatting
 */
export type {
  TriggerResult,
  RuleResult,
  EvaluationContext,
  EvaluationResult,
  ExecutionMode,
  GroupRespondMode,
} from './chatbotEngine/index.js';

export {
  evaluateTriggers,
  evaluateConditions,
  findBotsForMessage,
  pickBestBot,
} from './chatbotEngine/index.js';
