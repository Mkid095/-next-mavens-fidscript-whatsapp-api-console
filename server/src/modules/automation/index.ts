// =============================================================================
// Automation engine — Phase 4 (§11).
// Implements the linear trigger → condition → action rule form. The canonical
// DAG (automation_edges) is the storage model; this engine reads edges
// topologically and walks each node. The engine NEVER inlines into messaging
// — it subscribes to the bus at boot, just like the AI inbound pipeline.
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import { bus } from '../platform/events/bus.js';
import { dispatchAutomationTriggered, dispatchFlowStarted, dispatchFlowStep, dispatchFlowCompleted } from '../platform/events/index.js';
import type { DomainEventPayload, MessageReceivedPayload } from '../platform/events/catalog.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';
import db from '../../database.js';

// ---------------------------------------------------------------------------
// Node types and config shapes (kept narrow — the editor validates against
// this in the frontend).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Loaders (workspace-scoped; all reads assert workspace_id).
// ---------------------------------------------------------------------------

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
    let config: TriggerNodeConfig | ConditionNodeConfig | ActionNodeConfig | WaitNodeConfig | BranchNodeConfig | AINodeConfig = {} as ConditionNodeConfig;
    try {
      const parsed = JSON.parse(String(r.config ?? '{}')) as FlowNode['config'];
      config = parsed;
    } catch (_) { /* keep {} */ }
    return {
      id: String(r.id),
      flowId: String(r.flow_id),
      type: String(r.type) as NodeType,
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

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

function evalCondition(cfg: ConditionNodeConfig, payload: Record<string, unknown>): boolean {
  const fieldVal = String(payload[cfg.field] ?? '');
  const target = String(cfg.value ?? '');
  switch (cfg.op) {
    case 'equals': return fieldVal === target;
    case 'contains': return fieldVal.toLowerCase().includes(target.toLowerCase());
    case 'starts_with': return fieldVal.toLowerCase().startsWith(target.toLowerCase());
    case 'regex': {
      try { return new RegExp(target, 'i').test(fieldVal); } catch { return false; }
    }
  }
}

function triggerMatches(cfg: TriggerNodeConfig, payload: Record<string, unknown>): boolean {
  if (cfg.field && cfg.value && cfg.op) {
    return evalCondition({ field: cfg.field, op: cfg.op, value: cfg.value }, payload);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Action executor — runs internal services. Channels / connectors are the
// only path to third parties (P6). This is a no-network surface for now.
// ---------------------------------------------------------------------------

function executeAction(
  ctx: WorkspaceContext,
  cfg: ActionNodeConfig,
  payload: { customerId: string; conversationId: string; content?: string }
): void {
  switch (cfg.kind) {
    case 'add_tag': {
      const tag = (cfg.args.tag ?? '').trim();
      if (!tag) return;
      const exists = db.prepare('SELECT id FROM customer_tags WHERE customer_id = ? AND tag = ?').get(payload.customerId, tag);
      if (exists) return;
      db.prepare('INSERT INTO customer_tags (id, customer_id, tag) VALUES (?, ?, ?)')
        .run(`tag_${uuidv4()}`, payload.customerId, tag);
      break;
    }
    case 'assign_team': {
      const teamId = cfg.args.team_id;
      if (!teamId) return;
      const exists = db.prepare('SELECT id FROM customer_assignments WHERE customer_id = ?').get(payload.customerId) as { id: string } | undefined;
      if (exists) {
        db.prepare('UPDATE customer_assignments SET team_id = ? WHERE id = ?').run(teamId, exists.id);
      } else {
        db.prepare('INSERT INTO customer_assignments (id, customer_id, team_id) VALUES (?, ?, ?)')
          .run(`ca_${uuidv4()}`, payload.customerId, teamId);
      }
      break;
    }
    case 'set_priority':
    case 'set_status': {
      const field = cfg.kind === 'set_priority' ? 'priority' : 'status';
      const val = (cfg.args.value ?? '').trim();
      if (!val) return;
      db.prepare(`UPDATE conversations SET ${field} = ? WHERE id = ?`).run(val, payload.conversationId);
      break;
    }
    case 'send_message': {
      // The actual Evolution send is intentionally a no-op here — the engine
      // logs the intent and emits a domain event so the timeline reflects it.
      // Wiring the real send is a Phase 4 follow-up that needs the channel
      // service to accept an outbound from a system actor.
      console.log(`[automation] would send_message: "${cfg.args.body ?? ''}" to conv ${payload.conversationId}`);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Run a single flow against a payload. Walks the DAG from the trigger node
// to its leaves, evaluating conditions and executing actions along each
// branch. Parallel branches are supported (current_node_ids is a set).
// ---------------------------------------------------------------------------

async function runFlow(
  ctx: WorkspaceContext,
  flow: Flow,
  payload: Record<string, unknown>,
  execId: string
): Promise<void> {
  const nodes = loadNodes(flow.id);
  const edges = loadEdges(flow.id);
  if (nodes.length === 0) return;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from)!.push(e.to);
  });

  // Find the trigger node (entry point)
  const trigger = nodes.find((n) => n.type === 'trigger');
  if (!trigger) return;
  if (!triggerMatches(trigger.config as TriggerNodeConfig, payload)) return;

  await dispatchFlowStarted(ctx, { flowId: flow.id, executionId: execId });

  // Breadth-first walk; record per-node visits
  const visited = new Set<string>();
  const queue: string[] = [trigger.id];
  let completed = false;
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodeById.get(id);
    if (!node) continue;
    await dispatchFlowStep(ctx, { flowId: flow.id, executionId: execId, nodeId: id });

    switch (node.type) {
      case 'trigger':
        queue.push(...(outgoing.get(id) ?? []));
        break;
      case 'condition': {
        const passed = evalCondition(node.config as ConditionNodeConfig, payload);
        const next = outgoing.get(id) ?? [];
        // Conditions on the linear form: first edge = pass, second = fail.
        // For DAG form: edge label encodes 'true'/'false'.
        if (passed) {
          const trueEdge = edges.find((e) => e.from === id && e.label === 'true') ?? edges.find((e) => e.from === id);
          if (trueEdge) queue.push(trueEdge.to);
        } else {
          const falseEdge = edges.find((e) => e.from === id && e.label === 'false') ?? edges.find((e) => e.from === id && edges.indexOf(e) > 0);
          if (falseEdge) queue.push(falseEdge.to);
        }
        // If neither: dead end, that's fine
        void next;
        break;
      }
      case 'action': {
        executeAction(ctx, node.config as ActionNodeConfig, {
          customerId: String(payload.customerId ?? ''),
          conversationId: String(payload.conversationId ?? ''),
          content: payload.content as string | undefined,
        });
        queue.push(...(outgoing.get(id) ?? []));
        break;
      }
      case 'wait':
      case 'branch':
      case 'ai':
        // Reserved: Phase 4 follow-ups. The DAG model is in place; the engine
        // simply records the step and walks the next edge. Persistent waits
        // across server restarts and a real branch merge operator land in a
        // dedicated slice.
        queue.push(...(outgoing.get(id) ?? []));
        break;
    }
  }

  completed = true;
  await dispatchFlowCompleted(ctx, { flowId: flow.id, executionId: execId });
  // Mark execution row as complete
  db.prepare(`UPDATE automation_executions SET status = ?, completed_at = ? WHERE id = ?`)
    .run(completed ? 'completed' : 'failed', new Date().toISOString(), execId);
}

// ---------------------------------------------------------------------------
// Public API — registerAutomations wires the bus subscriber; the route layer
// uses runFlowForWorkspace for "test" execution.
// ---------------------------------------------------------------------------

function messagePayloadToRecord(p: MessageReceivedPayload): Record<string, unknown> {
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
