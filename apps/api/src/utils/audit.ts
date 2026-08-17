import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import db from '../database.js';

// =============================================================================
// Legacy audit helpers - now backfilled with the new columns (§6.4).
// Existing 84 call sites continue to work; the new before/after JSON
// columns are populated when caller passes an object via parseDetails().
// =============================================================================

/** Try to parse the `details` string as a before/after JSON object. */
function splitDetails(details?: string): { before_json: string | null; after_json: string | null } {
  if (!details) return { before_json: null, after_json: null };
  try {
    const obj = JSON.parse(details);
    if (obj && typeof obj === 'object' && ('before' in obj || 'after' in obj)) {
      return {
        before_json: obj.before ? JSON.stringify(obj.before) : null,
        after_json: obj.after ? JSON.stringify(obj.after) : null,
      };
    }
  } catch {
    // not JSON - fall through
  }
  return { before_json: null, after_json: null };
}

export function logAuditAction(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
): void {
  const { before_json, after_json } = splitDetails(details);
  // Resolve actor + workspace: legacy requests had req.user; new platform
  // requests have req.client (which is the workspace owner). Both work.
  const actor = req.user?.id ?? (req as unknown as { client?: { id: string } }).client?.id ?? 'system';
  const workspaceId =
    (req as unknown as { workspace?: { workspaceId: string } }).workspace?.workspaceId ??
    (req as unknown as { client?: { id: string } }).client?.id ??
    null;

  db.prepare(`
    INSERT INTO audit_logs
      (id, user_id, actor_user_id, workspace_id, action, entity_type, entity_id,
       details, before_json, after_json, ip_address, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    actor,
    actor,
    workspaceId,
    action,
    entityType,
    entityId,
    details || null,
    before_json,
    after_json,
    req.ip ?? null,
    new Date().toISOString()
  );
}

export function logApiRequest(
  req: Request,
  instanceId: string | null,
  clientId: string | null,
  status: number,
  responseBody?: string
): void {
  const workspaceId =
    (req as unknown as { workspace?: { workspaceId: string } }).workspace?.workspaceId ??
    clientId ??
    null;
  const latencyMs = (req as unknown as { res?: { locals: { _t0?: number } } }).res?.locals?._t0 != null
    ? Date.now() - ((req as unknown as { res?: { locals: { _t0?: number } } }).res?.locals?._t0 as number)
    : null;

  db.prepare(`
    INSERT INTO api_logs
      (id, instance_id, client_id, workspace_id, method, endpoint, request_body,
       response_status, response_body, ip_address, user_agent, latency_ms, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    instanceId,
    clientId,
    workspaceId,
    req.method,
    req.path,
    JSON.stringify(req.body) || null,
    status,
    responseBody ? JSON.stringify(responseBody).substring(0, 1000) : null,
    req.ip ?? null,
    req.headers['user-agent'],
    latencyMs,
    new Date().toISOString()
  );
}
