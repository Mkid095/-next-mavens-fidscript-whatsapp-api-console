// Automation engine barrel — re-exports from .js impl files and types.ts
export type { NodeType, TriggerNodeConfig, ConditionNodeConfig, ActionNodeConfig, WaitNodeConfig, BranchNodeConfig, AINodeConfig, FlowNode, FlowEdge, Flow } from './types.js';

export { evalCondition, triggerMatches } from './conditionEvaluator.js';
export { loadFlows, loadNodes, loadEdges, messagePayloadToRecord, runFlowsForWorkspace, registerAutomations } from './rulesHandlers.js';
export { runFlow } from './engine.js';
