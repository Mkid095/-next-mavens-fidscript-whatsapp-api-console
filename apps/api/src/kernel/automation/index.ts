// Kernel Automation module — public barrel
export type {
  NodeType,
  TriggerNodeConfig,
  ConditionNodeConfig,
  ActionNodeConfig,
  WaitNodeConfig,
  BranchNodeConfig,
  AINodeConfig,
  AnyNodeConfig,
  FlowNode,
  FlowEdge,
  Flow,
} from './types.js';

export { evalCondition, triggerMatches } from './conditionEvaluator.js';
export { loadFlows, loadNodes, loadEdges } from './loaders.js';
export {
  executeAction,
  runFlow,
  messagePayloadToRecord,
  runFlowsForWorkspace,
  registerAutomations,
} from './engine.js';
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
