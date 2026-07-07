/**
 * Automation database loaders — workspace-scoped reads.
 */
import db from '../../database.js';
import type { Flow, FlowNode, FlowEdge, AnyNodeConfig } from './types.js';

export function loadFlows(workspaceId: string): Flow[] {
  const rows = db.prepare(`
    SELECT id, workspace_id, name, trigger_event, enabled, version
    FROM automation_flows WHERE workspace_id = ? AND enabled = 1
  `).all(workspaceId) as Record<string, unknown>[];
  return rows.map(r => ({
    id: String(r.id),
    workspaceId: String(r.workspace_id),
    name: String(r.name),
    triggerEvent: String(r.trigger_event ?? 'message.received'),
    enabled: Boolean(r.enabled ?? true),
    version: Number(r.version ?? 1),
  }));
}

export function loadNodes(flowId: string): FlowNode[] {
  const rows = db.prepare(`SELECT id, flow_id, type, config FROM automation_nodes WHERE flow_id = ?`).all(flowId) as Record<string, unknown>[];
  return rows.map(r => {
    let config: AnyNodeConfig = {} as AnyNodeConfig;
    try {
      config = JSON.parse(String(r.config ?? '{}')) as AnyNodeConfig;
    } catch (_) { /* keep {} */ }
    return {
      id: String(r.id),
      flowId: String(r.flow_id),
      type: String(r.type) as FlowNode['type'],
      config,
    };
  });
}

export function loadEdges(flowId: string): FlowEdge[] {
  const rows = db.prepare(`SELECT from_node_id, to_node_id, label FROM automation_edges WHERE flow_id = ?`).all(flowId) as Record<string, unknown>[];
  return rows.map(r => ({
    from: String(r.from_node_id),
    to: String(r.to_node_id),
    label: r.label ? String(r.label) : undefined,
  }));
}
