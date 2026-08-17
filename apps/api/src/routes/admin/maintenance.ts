import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

/** DELETE /api/admin/maintenance/prune - delete expired idempotency keys */
router.delete('/prune', (req: Request, res: Response) => {
  try {
    const result = db.prepare(`
      DELETE FROM idempotency_keys
      WHERE (expires_at IS NOT NULL AND expires_at < datetime('now'))
         OR (expires_at IS NULL AND created_at < datetime('now', '-7 days'))
    `).run();

    res.json({
      success: true,
      data: { pruned: result.changes },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Prune failed' });
  }
});

/** GET /api/admin/maintenance/stats - key + log stats */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const idempotency = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now') THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN expires_at IS NULL AND created_at < datetime('now', '-7 days') THEN 1 ELSE 0 END) as old_no_ttl
      FROM idempotency_keys
    `).get() as { total: number; expired: number; old_no_ttl: number };

    const oldest = db.prepare(`
      SELECT created_at FROM idempotency_keys ORDER BY created_at ASC LIMIT 1
    `).get() as { created_at: string } | undefined;

    res.json({
      success: true,
      data: {
        idempotencyKeys: {
          total: idempotency.total,
          expiredOrOld: (idempotency.expired || 0) + (idempotency.old_no_ttl || 0),
          oldest: oldest?.created_at || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Stats failed' });
  }
});

export default router;