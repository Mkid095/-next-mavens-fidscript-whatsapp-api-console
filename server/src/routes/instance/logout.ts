import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callGateway, emitInstanceStateChange } from '../../utils/gateway.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// DELETE /api/instance/logout/:name - Disconnect instance from the gateway API
router.delete('/logout/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }

    try {
      const evolutionInstanceName = instance.evolution_name || `${req.client?.id}_${req.params.name}`;
      await callGateway('DELETE', `/instance/logout/${evolutionInstanceName}`);
    } catch (evoErr) {
      console.error('Failed to disconnect from the gateway API:', evoErr);
      // Don't treat as fatal — still update our DB state
    }

    db.prepare("UPDATE instances SET status = 'disconnected', qr_code = NULL, phone_number = NULL WHERE name = ?").run(req.params.name);
    emitInstanceStateChange(req.params.name, 'disconnected', null);
    logAuditAction(req, 'DISCONNECT', 'instance', instance.id, `Disconnected ${req.params.name}`);

    res.json({ success: true, message: 'Instance disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disconnect instance' });
  }
});

export default router;
