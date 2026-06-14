import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id, action, entityType, entityId, details || null, req.ip);
}

// DELETE /api/plans/:id - Delete a plan
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE plan_id = ?').get(req.params.id) as { count: number };

    if (clientCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete plan. ${clientCount.count} client(s) are using this plan.`,
      });
    }

    db.prepare('DELETE FROM plans WHERE id = ?').run(req.params.id);

    logAuditAction(req, 'DELETE', 'plan', req.params.id, `Deleted plan: ${(plan as { name: string }).name}`);

    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

export default router;