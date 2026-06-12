import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

router.use(adminAuth);

// Log admin action
function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id, action, entityType, entityId, details || null, req.ip);
}

// GET /api/plans - List all plans
router.get('/', (req: Request, res: Response) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC
    `).all();

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// POST /api/plans - Create a new plan
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Plan name is required',
      });
    }

    const id = `plan_${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      description || null,
      max_instances || 1,
      max_messages_per_month || 1000,
      msg_per_min || 10,
      price_monthly || 0,
      price_yearly || 0
    );

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);

    logAuditAction(req, 'CREATE', 'plan', id, `Created plan: ${name}`);

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Plan created successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// GET /api/plans/:id - Get plan details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }

    // Get count of clients using this plan
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE plan_id = ?').get(req.params.id) as { count: number };

    res.json({
      success: true,
      data: { ...plan, client_count: clientCount.count },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch plan' });
  }
});

// PUT /api/plans/:id - Update a plan
router.put('/:id', (req: Request, res: Response) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
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
    `).run(
      name,
      description,
      max_instances,
      max_messages_per_month,
      msg_per_min,
      price_monthly,
      price_yearly,
      is_active,
      req.params.id
    );

    const updatedPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    logAuditAction(req, 'UPDATE', 'plan', req.params.id, `Updated plan: ${name || 'plan'}`);

    res.json({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// DELETE /api/plans/:id - Delete a plan
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }

    // Check if any clients are using this plan
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE plan_id = ?').get(req.params.id) as { count: number };

    if (clientCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete plan. ${clientCount.count} client(s) are using this plan.`,
      });
    }

    db.prepare('DELETE FROM plans WHERE id = ?').run(req.params.id);

    logAuditAction(req, 'DELETE', 'plan', req.params.id, `Deleted plan: ${(plan as { name: string }).name}`);

    res.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

export default router;
