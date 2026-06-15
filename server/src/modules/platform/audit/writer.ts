import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import db from '../../../database.js';
import type { WorkspaceContext } from '../workspace/index.js';

// =============================================================================
// Audit writer — distinct from domain_events.
// Every privileged mutation writes a before/after row.
// Read via GET /api/audit behind audit.view permission.
// =============================================================================

export interface AuditAction {
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string;
}

export function logAuditAction(
  ctx: WorkspaceContext,
  { action, resourceType, resourceId, before, after, ipAddress }: AuditAction,
  request?: Request
): void {
  db.prepare(`
    INSERT INTO audit_logs
      (id, workspace_id, actor_user_id, action, resource_type, resource_id,
       before_json, after_json, ip_address, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    ctx.workspaceId,
    ctx.userId,
    action,
    resourceType,
    resourceId,
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null,
    ipAddress ?? request?.ip ?? null,
    new Date().toISOString()
  );
}

// ---------------------------------------------------------------------------
// Convenience: log a state transition (before → after)
// ---------------------------------------------------------------------------

export function logStateTransition(
  ctx: WorkspaceContext,
  resourceType: string,
  resourceId: string,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  request?: Request
): void {
  logAuditAction(ctx, {
    action: `${resourceType}.${field}_changed`,
    resourceType,
    resourceId,
    before: { [field]: oldValue },
    after: { [field]: newValue },
  }, request);
}

// ---------------------------------------------------------------------------
// API request log (existing — retained for compatibility)
// ---------------------------------------------------------------------------

export function logApiRequest(
  req: Request,
  instanceId: string | null,
  clientId: string | null,
  status: number,
  responseBody?: string
): void {
  db.prepare(`
    INSERT INTO api_logs
      (id, instance_id, client_id, method, endpoint, request_body,
       response_status, response_body, ip_address, user_agent, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    instanceId,
    clientId,
    req.method,
    req.path,
    JSON.stringify(req.body) || null,
    status,
    responseBody ? JSON.stringify(responseBody).substring(0, 1000) : null,
    req.ip,
    req.headers['user-agent'],
    new Date().toISOString()
  );
}
