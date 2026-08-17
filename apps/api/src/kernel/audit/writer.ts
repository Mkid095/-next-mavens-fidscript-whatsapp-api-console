import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import db from '../../database.js';
import type { WorkspaceContext } from '../../modules/platform/workspace/index.js';

// =============================================================================
// Audit writer - distinct from domain_events.
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
      (id, workspace_id, actor_user_id, action, entity_type, entity_id,
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

export function logApiRequest(
  req: Request,
  instanceId: string | null,
  clientId: string | null,
  status: number,
  responseBody?: string,
  options?: { latencyMs?: number; workspaceId?: string | null }
): void {
  db.prepare(`
    INSERT INTO api_logs
      (id, instance_id, client_id, workspace_id, method, endpoint, request_body,
       response_status, response_body, ip_address, user_agent, latency_ms, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    instanceId,
    clientId,
    options?.workspaceId ?? null,
    req.method,
    req.path,
    JSON.stringify(req.body) || null,
    status,
    responseBody ? JSON.stringify(responseBody).substring(0, 1000) : null,
    req.ip,
    req.headers['user-agent'],
    options?.latencyMs ?? null,
    new Date().toISOString()
  );
}

export function responseTimeMiddleware() {
  return (req: Request, res: Response, next: () => void): void => {
    (res as Response & { locals: Record<string, unknown> }).locals._t0 = Date.now();
    next();
  };
}

export function latencyMs(res: Response): number | null {
  const t0 = (res as Response & { locals: Record<string, unknown> }).locals._t0 as number | undefined;
  return typeof t0 === 'number' ? Date.now() - t0 : null;
}
