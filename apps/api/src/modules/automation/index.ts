// Automation barrel — forwarding re-export from canonical kernel location.
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
} from '../../kernel/automation/types.js';

export { evalCondition, triggerMatches } from '../../kernel/automation/conditionEvaluator.js';
export { loadFlows, loadNodes, loadEdges } from '../../kernel/automation/loaders.js';
export {
  executeAction,
  runFlow,
  messagePayloadToRecord,
  runFlowsForWorkspace,
  registerAutomations,
} from '../../kernel/automation/engine.js';
export type {
  TriggerResult,
  RuleResult,
  EvaluationContext,
  EvaluationResult,
  ExecutionMode,
  GroupRespondMode,
} from '../../kernel/automation/chatbotEngine/index.js';
export {
  evaluateTriggers,
  evaluateConditions,
  findBotsForMessage,
  pickBestBot,
} from '../../kernel/automation/chatbotEngine/index.js';
