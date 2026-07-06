// Automation rule loaders + bus registration.
import { v4 as uuidv4 } from 'uuid';
import { bus } from '../platform/events/bus.js';
import { dispatchAutomationTriggered, dispatchFlowStarted, dispatchFlowStep, dispatchFlowCompleted } from '../platform/events/index.js';
import type { DomainEventPayload, MessageReceivedPayload } from '../platform/events/catalog.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';
import type { Flow, FlowNode, FlowEdge } from './index.js';
import db from '../../database.js';

function loadFlows(workspaceId: string): Flow[] {
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

function loadNodes(flowId: string): FlowNode[] {
  const rows = db.prepare(`SELECT id, flow_id, type, config FROM automation_nodes WHERE flow_id = ?`).all(flowId) as Record<string, unknown>[];
  return rows.map(r => {
    let config: FlowNode['config'] = {} as FlowNode['config'];
    try {
      config = JSON.parse(String(r.config ?? '{}')) as FlowNode['config'];
    } catch (_) { /* keep {} */ }
    return {
      id: String(r.id),
      flowId: String(r.flow_id),
      type: String(r.type) as FlowNode['type'],
      config,
    };
  });
}

function loadEdges(flowId: string): FlowEdge[] {
  const rows = db.prepare(`SELECT from_node_id, to_node_id, label FROM automation_edges WHERE flow_id = ?`).all(flowId) as Record<string, unknown>[];
  return rows.map(r => ({
    from: String(r.from_node_id),
    to: String(r.to_node_id),
    label: r.label ? String(r.label) : undefined,
  }));
}

export function messagePayloadToRecord(p: MessageReceivedPayload): Record<string, unknown> {
  return {
    event: 'message.received',
    conversationId: p.conversationId,
    customerId: p.customerId,
    channel: p.channel,
    messageType: p.messageType,
    content: p.content,
    fromNumber: p.fromNumber,
    fromName: p.fromName,
  };
}

export { loadFlows, loadNodes, loadEdges };

export async function runFlowsForWorkspace(
  ctx: WorkspaceContext,
  triggerEvent: string,
  payload: Record<string, unknown>
): Promise<void> {
  const flows = loadFlows(ctx.workspaceId).filter((f) => f.triggerEvent === triggerEvent);
  for (const flow of flows) {
    const execId = `exec_${uuidv4()}`;
    db.prepare(`
      INSERT INTO automation_executions (id, flow_id, customer_id, conversation_id, status, current_node_ids, started_at, context)
      VALUES (?, ?, ?, ?, 'running', '[]', ?, ?)
    `).run(
      execId,
      flow.id,
      String(payload.customerId ?? ''),
      String(payload.conversationId ?? ''),
      new Date().toISOString(),
      JSON.stringify(payload),
    );
    await dispatchAutomationTriggered(ctx, {
      flowId: flow.id,
      triggerEvent,
      conversationId: String(payload.conversationId ?? ''),
      customerId: String(payload.customerId ?? ''),
    });
    try {
      const { runFlow } = await import('./engine.js');
      await runFlow(ctx, flow, payload, execId);
    } catch (err) {
      console.error(`[automation] flow ${flow.id} (${flow.name}) failed:`, err);
      db.prepare(`UPDATE automation_executions SET status = 'failed', completed_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), execId);
    }
  }
}

export function registerAutomations(): void {
  bus().subscribe('message.received', async (raw: DomainEventPayload) => {
    const p = raw as unknown as Record<string, unknown>;
    const wsId = String(p.workspaceId ?? '');
    if (!wsId) return;
    const ctx: WorkspaceContext = {
      workspaceId: wsId,
      userId: wsId,
      roleId: 'role_0',
      perms: ['*'],
    };
    try {
      await runFlowsForWorkspace(ctx, 'message.received', messagePayloadToRecord(raw as MessageReceivedPayload));
    } catch (err) {
      console.error('[automation] subscriber error:', err);
    }
  });
}
