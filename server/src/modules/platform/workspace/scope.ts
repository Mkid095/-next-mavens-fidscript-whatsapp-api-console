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

/**
 * Returns a `[fragment, params]` tuple suitable for splicing into a SQL WHERE
 * clause. `alias` is the table alias the query uses (or '' for the bare table).
 * Reads `req.workspace.workspaceId` (the canonical P11 source) and falls back
 * to `req.client.id` for routes still on the legacy client-JWT pattern.
 */
export function whereWorkspace(req: Request, alias: string = ''): [string, string[]] {
  const workspaceId = resolveWorkspaceId(req);
  if (!workspaceId) {
    // No workspace context = a code-path bug; force the query to return
    // zero rows rather than leak. Better to over-deny than under-deny.
    return ['1 = 0', []];
  }
  const prefix = alias ? `${alias}.` : '';
  return [`${prefix}workspace_id = ?`, [workspaceId]];
}

/**
 * Same as whereWorkspace but emits the fragment WITHOUT a leading AND/WHERE.
 * For UPDATE/DELETE: returns the fragment to append to the WHERE clause.
 */
export function workspaceFilter(req: Request, alias: string = ''): [string, string[]] {
  return whereWorkspace(req, alias);
}

function resolveWorkspaceId(req: Request): string | null {
  // Preferred: canonical WorkspaceContext set by workspaceAuth middleware
  const ws = (req as AuthenticatedRequest).workspace;
  if (ws?.workspaceId) return ws.workspaceId;
  // Legacy bridge: routes that still rely on clientJwtAuth populate req.client
  const client = (req as Request & { client?: { id: string } }).client;
  if (client?.id) return client.id;
  return null;
}
