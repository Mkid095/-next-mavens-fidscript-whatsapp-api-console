// Type declarations for rulesHandlers.js
import type { Flow, FlowNode, FlowEdge } from './types.js';
import type { DomainEventPayload, MessageReceivedPayload } from '../platform/events/catalog.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';
export function loadFlows(workspaceId: string): Flow[];
export function loadNodes(flowId: string): FlowNode[];
export function loadEdges(flowId: string): FlowEdge[];
export function messagePayloadToRecord(p: MessageReceivedPayload): Record<string, unknown>;
export declare function runFlowsForWorkspace(ctx: WorkspaceContext, triggerEvent: string, payload: Record<string, unknown>): Promise<void>;
export declare function registerAutomations(): void;
