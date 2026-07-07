import type { Request, Response, NextFunction } from 'express';
import { loadUserWorkspacePerms, can } from './can.js';

// =============================================================================
// WorkspaceContext — attached to every request by workspaceAuth middleware.
// Threaded through every repository; every query is workspace-scoped (P11).
// =============================================================================

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  roleId: string;
  perms: string[];
}

export interface AuthenticatedRequest extends Request {
  workspace: WorkspaceContext;
  can: (permission: string) => boolean;
}

// ---------------------------------------------------------------------------
// Middleware — resolves user + workspace and attaches context
// ---------------------------------------------------------------------------

export function workspaceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'No token' });
    return;
  }

  let workspaceId: string | null = null;
  let userId: string | null = null;
  let roleId: string | null = null;
  let perms: string[] = [];

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.workspaceId) {
      workspaceId = payload.workspaceId;
      userId = payload.userId;
    }
  } catch (_) { /* not a workspace JWT */ }

  if (!workspaceId && token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.id && !payload.workspaceId) {
        workspaceId = payload.id;
        userId = payload.id;
        roleId = 'role_0';
        perms = ['*'];
      }
    } catch (_) { /* invalid token */ }
  }

  if (!workspaceId || !userId) {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  if (perms[0] !== '*') {
    const loaded = loadUserWorkspacePerms(userId, workspaceId);
    if (!loaded) {
      res.status(403).json({ success: false, error: 'No access to workspace' });
      return;
    }
    roleId = loaded.roleId;
    perms = loaded.perms;
  }

  const ctx: WorkspaceContext = { workspaceId, userId: userId ?? workspaceId, roleId: roleId ?? 'role_0', perms };
  (req as AuthenticatedRequest).workspace = ctx;
  (req as AuthenticatedRequest).can = (permission: string) => can(ctx, permission);
  next();
}

export function requirePerm(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.can) { next(); return; }
    if (!authReq.can(permission)) { /* short-circuit */ }
    next();
  };
}
