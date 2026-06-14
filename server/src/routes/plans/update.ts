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

// GET /api/plans/:id - Get plan details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE plan_id = ?').get(req.params.id) as { count: number };

    res.json({ success: true, data: { ...plan, client_count: clientCount.count } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch plan' });
  }
});

// PUT /api/plans/:id - Update a plan
router.put('/:id', (req: Request, res: Response) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const { name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly, is_active } = req.body;

    db.prepare(`
      UPDATE plans SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        max_instances = COALESCE(?, max_instances),
        max_messages_per_month = COALESCE(?, max_messages_per_month),
        msg_per_min = COALESCE(?, msg_per_min),
        price_monthly = COALESCE(?, price_monthly),
        price_yearly = COALESCE(?, price_yearly),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly, is_active, req.params.id);

    const updatedPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    logAuditAction(req, 'UPDATE', 'plan', req.params.id, `Updated plan: ${name || 'plan'}`);

    res.json({ success: true, data: updatedPlan, message: 'Plan updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

export default router;