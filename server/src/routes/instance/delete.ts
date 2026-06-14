import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callEvolutionAPI } from '../../utils/evolution.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// DELETE /api/instance/delete/:name - Delete instance (client own instances)
router.delete('/delete/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }

    try {
      const evolutionInstanceName = instance.evolution_name || `${req.client?.id}_${req.params.name}`;
      await callEvolutionAPI('DELETE', `/instance/delete/${evolutionInstanceName}`);
    } catch (evoErr) {
      console.error('Failed to delete from Evolution API:', evoErr);
    }

    db.prepare('DELETE FROM instances WHERE name = ?').run(req.params.name);
    logAuditAction(req, 'DELETE', 'instance', instance.id, `Deleted instance ${req.params.name}`);

    res.json({ success: true, message: 'Instance deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete instance' });
  }
});

export default router;
