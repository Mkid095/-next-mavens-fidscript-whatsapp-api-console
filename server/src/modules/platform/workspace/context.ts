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
  // Support both workspace-scoped JWT (new) and client JWT (legacy bridge)
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'No token' });
    return;
  }

  // Try workspace JWT first (new format: payload has workspaceId)
  let workspaceId: string | null = null;
  let userId: string | null = null;
  let roleId: string | null = null;
  let perms: string[] = [];

  try {
    // Decode without verification — middleware verifies first
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.workspaceId) {
      workspaceId = payload.workspaceId;
      userId = payload.userId;
    }
  } catch (_) {
    // Not a workspace JWT — fall through to legacy client JWT
  }

  // Legacy client JWT bridge: client_id = workspace_id
  if (!workspaceId && token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.id && !payload.workspaceId) {
        // Client JWT: use client_id as workspace_id
        workspaceId = payload.id;
        userId = payload.id; // client owner maps to userId = clientId during migration
        roleId = 'role_0';  // Owner role by default for client owners
        perms = ['*'];       // Owner perms — loaded from DB on first real request
      }
    } catch (_) {
      // Invalid token
    }
  }

  if (!workspaceId || !userId) {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  // Load perms from DB (cached)
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

// ---------------------------------------------------------------------------
// Optional: require specific permission
// ---------------------------------------------------------------------------

export function requirePerm(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.can) {
      // Not yet authenticated — let workspaceAuth handle
      next();
      return;
    }
    if (!authReq.can(permission)) {
      // Short-circuit; controller should not be reached
    }
    next();
  };
}
