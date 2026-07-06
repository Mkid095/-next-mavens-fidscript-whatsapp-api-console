import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import type { Client } from '../../types.js';

const router = Router();
router.use(adminAuth);

function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id, action, entityType, entityId, details || null, req.ip);
}

// DELETE /api/clients/:id - Remove client
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    db.prepare('DELETE FROM instances WHERE client_id = ?').run(req.params.id);
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

    logAuditAction(req, 'DELETE', 'client', req.params.id, `Deleted client: ${client.name}`);

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete client' });
  }
});

export default router;