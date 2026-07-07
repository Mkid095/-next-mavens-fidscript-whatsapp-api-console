/**
 * Automation engine — core execution logic.
 */
import { v4 as uuidv4 } from 'uuid';
import { bus } from '../events/index.js';
import { dispatchAutomationTriggered, dispatchFlowStarted, dispatchFlowStep, dispatchFlowCompleted } from '../events/index.js';
import type { DomainEventPayload, MessageReceivedPayload, SlaBreachedPayload, SlaResponseDuePayload } from '../events/index.js';
import type { WorkspaceContext } from '../identity/index.js';
import db from '../../database.js';
import type { Flow, FlowNode, FlowEdge, TriggerNodeConfig, ConditionNodeConfig, ActionNodeConfig } from './types.js';
import { loadFlows, loadNodes, loadEdges } from './loaders.js';

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

export function evalCondition(cfg: ConditionNodeConfig, payload: Record<string, unknown>): boolean {
  const fieldVal = String(payload[cfg.field] ?? '');
  const target = String(cfg.value ?? '');
  switch (cfg.op) {
    case 'equals': return fieldVal === target;
    case 'contains': return fieldVal.toLowerCase().includes(target.toLowerCase());
    case 'starts_with': return fieldVal.toLowerCase().startsWith(target.toLowerCase());
    case 'regex': {
      try { return new RegExp(target, 'i').test(fieldVal); } catch { return false; }
    }
    default: return false;
  }
}

export function triggerMatches(cfg: TriggerNodeConfig, payload: Record<string, unknown>): boolean {
  if (cfg.field && cfg.value && cfg.op) {
    return evalCondition({ field: cfg.field, op: cfg.op, value: cfg.value }, payload);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

export function executeAction(
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
      console.log(`[automation] would send_message: "${cfg.args.body ?? ''}" to conv ${payload.conversationId}`);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Flow runner
// ---------------------------------------------------------------------------

export async function runFlow(
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

  const trigger = nodes.find((n) => n.type === 'trigger');
  if (!trigger) return;
  if (!triggerMatches(trigger.config as TriggerNodeConfig, payload)) return;

  await dispatchFlowStarted(ctx, { flowId: flow.id, executionId: execId });

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
        if (passed) {
          const trueEdge = edges.find((e) => e.from === id && e.label === 'true') ?? edges.find((e) => e.from === id);
          if (trueEdge) queue.push(trueEdge.to);
        } else {
          const falseEdge = edges.find((e) => e.from === id && e.label === 'false') ?? edges.find((e) => e.from === id && edges.indexOf(e) > 0);
          if (falseEdge) queue.push(falseEdge.to);
        }
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
        queue.push(...(outgoing.get(id) ?? []));
        break;
    }
  }

  completed = true;
  await dispatchFlowCompleted(ctx, { flowId: flow.id, executionId: execId });
  db.prepare(`UPDATE automation_executions SET status = ?, completed_at = ? WHERE id = ?`)
    .run(completed ? 'completed' : 'failed', new Date().toISOString(), execId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
  // ── Message-received trigger ──────────────────────────────────────────────
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

  // ── Connector event triggers ───────────────────────────────────────────────
  // Shopify order events
  bus().subscribe('shopify.order.created', async (raw: DomainEventPayload) => {
    const p = raw as unknown as Record<string, unknown>;
    const wsId = String(p.workspaceId ?? '');
    if (!wsId) return;
    const ctx: WorkspaceContext = { workspaceId: wsId, userId: wsId, roleId: 'role_0', perms: ['*'] };
    try {
      await runFlowsForWorkspace(ctx, 'shopify.order.created', {
        event: 'shopify.order.created',
        workspaceId: wsId,
        orderId: String(p.orderId ?? ''),
        orderName: String(p.orderName ?? ''),
        customerEmail: p.customerEmail ? String(p.customerEmail) : '',
        customerPhone: p.customerPhone ? String(p.customerPhone) : '',
        totalPrice: Number(p.totalPrice ?? 0),
        currency: String(p.currency ?? ''),
        status: String(p.status ?? ''),
      });
    } catch (err) {
      console.error('[automation] shopify.order.created error:', err);
    }
  });

  bus().subscribe('shopify.order.updated', async (raw: DomainEventPayload) => {
    const p = raw as unknown as Record<string, unknown>;
    const wsId = String(p.workspaceId ?? '');
    if (!wsId) return;
    const ctx: WorkspaceContext = { workspaceId: wsId, userId: wsId, roleId: 'role_0', perms: ['*'] };
    try {
      await runFlowsForWorkspace(ctx, 'shopify.order.updated', {
        event: 'shopify.order.updated',
        workspaceId: wsId,
        orderId: String(p.orderId ?? ''),
        status: String(p.status ?? ''),
        totalPrice: Number(p.totalPrice ?? 0),
        currency: String(p.currency ?? ''),
      });
    } catch (err) {
      console.error('[automation] shopify.order.updated error:', err);
    }
  });

  // WooCommerce order events
  bus().subscribe('woocommerce.order.created', async (raw: DomainEventPayload) => {
    const p = raw as unknown as Record<string, unknown>;
    const wsId = String(p.workspaceId ?? '');
    if (!wsId) return;
    const ctx: WorkspaceContext = { workspaceId: wsId, userId: wsId, roleId: 'role_0', perms: ['*'] };
    try {
      await runFlowsForWorkspace(ctx, 'woocommerce.order.created', {
        event: 'woocommerce.order.created',
        workspaceId: wsId,
        orderId: String(p.orderId ?? ''),
        customerEmail: p.customerEmail ? String(p.customerEmail) : '',
        total: String(p.total ?? ''),
        currency: String(p.currency ?? ''),
        status: String(p.status ?? ''),
      });
    } catch (err) {
      console.error('[automation] woocommerce.order.created error:', err);
    }
  });

  // ── SLA breach triggers ─────────────────────────────────────────────────────
  bus().subscribe('sla.response_due', async (raw: DomainEventPayload) => {
    const p = raw as unknown as SlaResponseDuePayload;
    if (!p.conversationId) return;
    const conv = db.prepare(`SELECT workspace_id FROM conversations WHERE id = ?`)
      .get(p.conversationId) as { workspace_id: string } | undefined;
    if (!conv) return;
    const ctx: WorkspaceContext = { workspaceId: conv.workspace_id, userId: conv.workspace_id, roleId: 'role_0', perms: ['*'] };
    try {
      await runFlowsForWorkspace(ctx, 'sla.response_due', {
        event: 'sla.response_due',
        conversationId: p.conversationId,
        policyId: p.policyId,
      });
    } catch (err) {
      console.error('[automation] sla.response_due error:', err);
    }
  });

  bus().subscribe('sla.breached', async (raw: DomainEventPayload) => {
    const p = raw as unknown as SlaBreachedPayload;
    if (!p.conversationId) return;
    const conv = db.prepare(`SELECT workspace_id FROM conversations WHERE id = ?`)
      .get(p.conversationId) as { workspace_id: string } | undefined;
    if (!conv) return;
    const ctx: WorkspaceContext = { workspaceId: conv.workspace_id, userId: conv.workspace_id, roleId: 'role_0', perms: ['*'] };
    try {
      await runFlowsForWorkspace(ctx, 'sla.breached', {
        event: 'sla.breached',
        conversationId: p.conversationId,
        policyId: p.policyId,
        kind: p.kind,
      });
    } catch (err) {
      console.error('[automation] sla.breached error:', err);
    }
  });
}
