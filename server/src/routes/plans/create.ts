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

// POST /api/plans - Create a new plan
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Plan name is required' });
    }

    const id = `plan_${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, max_instances || 1, max_messages_per_month || 1000, msg_per_min || 10, price_monthly || 0, price_yearly || 0);

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);

    logAuditAction(req, 'CREATE', 'plan', id, `Created plan: ${name}`);

    res.status(201).json({ success: true, data: plan, message: 'Plan created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

export default router;