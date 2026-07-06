import db from '../../../database.js';

// =============================================================================
// can() — the one permission seam. Every privileged action calls this.
// Returns true/false. Routes call req.can() — nothing hand-rolls role checks.
// =============================================================================

interface PermScope {
  workspaceId: string;
  userId: string;
  roleId: string;
  perms: string[];
}

export function can(scope: PermScope, permission: string): boolean {
  // Owner role (role_0) has all permissions
  if (scope.roleId === 'role_0') return true;
  return scope.perms.includes(permission);
}

// ---------------------------------------------------------------------------
// Load permissions for a user in a workspace (cached in-memory)
// ---------------------------------------------------------------------------

const _permCache = new Map<string, { perms: string[]; roleId: string; ts: number }>();
const CACHE_TTL_MS = 30_000;

export function loadUserWorkspacePerms(
  userId: string,
  workspaceId: string
): { perms: string[]; roleId: string } | null {
  const key = `${userId}:${workspaceId}`;
  const cached = _permCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { perms: cached.perms, roleId: cached.roleId };
  }

  const row = db.prepare(`
    SELECT rm.role_id, p.key as perm
    FROM workspace_members rm
    JOIN role_permissions rp ON rp.role_id = rm.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rm.user_id = ? AND rm.workspace_id = ? AND rm.status = 'active'
  `).all(userId, workspaceId) as { role_id: string; perm: string }[];

  if (!row.length) return null;

  const roleId = row[0].role_id;
  const perms = [...new Set(row.map(r => r.perm))];

  _permCache.set(key, { perms, roleId, ts: Date.now() });
  return { perms, roleId };
}

export function invalidatePermCache(userId: string, workspaceId: string): void {
  _permCache.delete(`${userId}:${workspaceId}`);
}
