import type { Request } from 'express';
import type { AuthenticatedRequest } from './context.js';

// =============================================================================
// whereWorkspace — the SQL helper that closes the cross-tenant leak.
//
// Every platform query that reads/writes customer-scoped data must call this
// helper and include the returned fragment + param. It is the only supported
// way to bind a workspace filter; raw `WHERE client_id = ?` or no scope at
// all is the bug this helper exists to prevent (P11).
//
// Usage:
//   const [where, params] = whereWorkspace(req, 'ct');
//   db.prepare(`SELECT * FROM customer_tags ct WHERE ${where}`).all(...params);
//   //  ->  SELECT * FROM customer_tags ct WHERE ct.workspace_id = ?
//   //      binds req.workspace.workspaceId
// =============================================================================

export function whereWorkspace(req: Request, alias: string = ''): [string, string[]] {
  const workspaceId = resolveWorkspaceId(req);
  if (!workspaceId) {
    return ['1 = 0', []];
  }
  const prefix = alias ? `${alias}.` : '';
  return [`${prefix}workspace_id = ?`, [workspaceId]];
}

export function workspaceFilter(req: Request, alias: string = ''): [string, string[]] {
  return whereWorkspace(req, alias);
}

function resolveWorkspaceId(req: Request): string | null {
  const ws = (req as AuthenticatedRequest).workspace;
  if (ws?.workspaceId) return ws.workspaceId;
  const client = (req as Request & { client?: { id: string } }).client;
  if (client?.id) return client.id;
  return null;
}
