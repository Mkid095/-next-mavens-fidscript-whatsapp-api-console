// Automation types — shared across engine, rulesHandlers, and the barrel.
export type NodeType = 'trigger' | 'condition' | 'action' | 'wait' | 'branch' | 'ai';

export interface TriggerNodeConfig { event: string; field?: string; op?: 'equals' | 'contains' | 'starts_with' | 'regex'; value?: string; }
export interface ConditionNodeConfig { field: string; op: 'equals' | 'contains' | 'starts_with' | 'regex'; value: string; }
export interface ActionNodeConfig { kind: 'send_message' | 'add_tag' | 'assign_team' | 'set_priority' | 'set_status'; args: Record<string, string>; }
export interface WaitNodeConfig { minutes: number; }
export interface BranchNodeConfig { branches: Array<{ label: string; condition: ConditionNodeConfig }>; }
export interface AINodeConfig { agentId: string; prompt?: string; }

export interface FlowNode {
  id: string;
  flowId: string;
  type: NodeType;
  config: TriggerNodeConfig | ConditionNodeConfig | ActionNodeConfig | WaitNodeConfig | BranchNodeConfig | AINodeConfig;
}

export interface FlowEdge { from: string; to: string; label?: string; }
export interface Flow { id: string; workspaceId: string; name: string; triggerEvent: string; enabled: boolean; version: number; }
