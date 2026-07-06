// Core automation evaluation engine.
import { v4 as uuidv4 } from 'uuid';
import { dispatchFlowStarted, dispatchFlowStep, dispatchFlowCompleted } from '../platform/events/index.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';
import type { Flow, FlowNode, FlowEdge, TriggerNodeConfig, ConditionNodeConfig, ActionNodeConfig } from './index.js';
import { evalCondition, triggerMatches } from './conditionEvaluator.js';
import db from '../../database.js';

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
      console.log(`[automation] would send_message: "${cfg.args.body ?? ''}" to conv ${payload.conversationId}`);
      break;
    }
  }
}

export async function runFlow(
  ctx: WorkspaceContext,
  flow: Flow,
  payload: Record<string, unknown>,
  execId: string
): Promise<void> {
  const { loadNodes, loadEdges } = await import('./rulesHandlers.js');
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
