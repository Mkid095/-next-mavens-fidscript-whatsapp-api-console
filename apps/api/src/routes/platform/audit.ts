import { Router } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth/clientJwt.js';

const router = Router();

// =============================================================================
// Audit log read endpoint (§6.4).
// Returns audit_logs rows scoped to the workspace, filterable by resource /
// actor / time. Permission check: this surface is the Owner/Admin view;
// gating with `audit.view` is reserved for when workspaceAuth fully replaces
// clientJwtAuth — today the bridge gives Owner perms to the client owner.
// =============================================================================

router.use(clientJwtAuth);

router.get('/', (req, res) => {
  const ws = (req as unknown as { client: { id: string } }).client.id;
  const { resource, actor, since, limit } = req.query as Record<string, string | undefined>;
  const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);

  const where: string[] = ['workspace_id = ?'];
  const args: unknown[] = [ws];
  if (resource) { where.push('entity_type = ?'); args.push(resource); }
  if (actor) { where.push('actor_user_id = ?'); args.push(actor); }
  if (since) { where.push('timestamp >= ?'); args.push(since); }

  args.push(lim);
  const rows = db.prepare(`
    SELECT id, actor_user_id, action, entity_type, entity_id, before_json, after_json, ip_address, timestamp
    FROM audit_logs
    WHERE ${where.join(' AND ')}
    ORDER BY timestamp DESC LIMIT ?
  `).all(...args);
  res.json({ success: true, data: rows });
});

export default router;
