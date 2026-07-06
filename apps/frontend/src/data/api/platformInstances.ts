/**
 * Platform API — re-exported from platformAgents.ts, platformInstances2.ts, platformInstances3.ts.
 */

export { platformAgentsApi, platformAIRulesApi } from './platformAgents.js';
export { platformFlowsApi, platformMediaApi, platformSegmentsApi, platformStatusPostsApi } from './platformInstances2.js';
export { platformWebhooksApi, platformLogsApi, platformTeamsApi, platformSLAPoliciesApi } from './platformInstances3.js';

export type {
  Agent, AIRule,
} from './platformAgents.js';
export type {
  FlowSummary, FlowNodeInput, FlowEdgeInput, FlowDetail, FlowExecution,
  MediaKind, MediaAsset, SegmentRule, SegmentFilter, Segment, SegmentPreview,
  StatusPostKind, StatusPostState, StatusPost, CreateStatusPostInput,
} from './platformInstances2.js';
