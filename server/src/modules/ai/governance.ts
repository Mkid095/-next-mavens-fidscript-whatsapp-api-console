import db from '../../database.js';
import { logAuditAction } from '../platform/audit/index.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';

// =============================================================================
// canAgent() — the AI governance seam.
// Every tool/action the agent invokes is gated by this function.
// Denials are written to audit_logs.
// =============================================================================

const ACTION_CATALOG = [
  'catalog.read', 'catalog.write',
  'orders.read', 'orders.refund', 'orders.update',
  'tickets.create', 'tickets.update',
  'customers.read', 'customers.update', 'customers.delete',
  'messages.send', 'messages.send_template',
  'knowledge.read',
  'http.fetch', // off by default
];

export function listAgentActions(): string[] {
  return [...ACTION_CATALOG];
}

export function canAgent(
  agentId: string,
  action: string,
  _ctx: WorkspaceContext
): boolean {
  // System agents (id starts with 'sys_') have all permissions
  if (agentId.startsWith('sys_')) return true;

  // Check explicit allow-list
  const row = db.prepare(
    'SELECT 1 FROM agent_permissions WHERE agent_id = ? AND action = ?'
  ).get(agentId, action);

  if (row) return true;

  // Deny by default — not in the allow-list
  return false;
}

// ---------------------------------------------------------------------------
// Log a denied agent action to audit_logs
// ---------------------------------------------------------------------------

export function logAgentDenial(
  ctx: WorkspaceContext,
  agentId: string,
  action: string,
  conversationId: string
): void {
  logAuditAction(ctx, {
    action: `agent.denied`,
    resourceType: 'ai_agent',
    resourceId: agentId,
    before: null,
    after: { action, conversationId, denied: true },
  });
}

// ---------------------------------------------------------------------------
// Get agent's allowed actions
// ---------------------------------------------------------------------------

export function getAgentPermissions(agentId: string): string[] {
  const rows = db.prepare(
    'SELECT action FROM agent_permissions WHERE agent_id = ?'
  ).all(agentId) as { action: string }[];
  return rows.map(r => r.action);
}

// ---------------------------------------------------------------------------
// Grant an action to an agent
// ---------------------------------------------------------------------------

export function grantAgentPermission(
  ctx: WorkspaceContext,
  agentId: string,
  action: string
): void {
  if (!ACTION_CATALOG.includes(action)) return;
  db.prepare(
    'INSERT OR IGNORE INTO agent_permissions (id, agent_id, action) VALUES (?, ?, ?)'
  ).run(`ap_${agentId}_${action}`, agentId, action);
  logAuditAction(ctx, {
    action: 'agent.permission.granted',
    resourceType: 'ai_agent',
    resourceId: agentId,
    after: { action },
  });
}
