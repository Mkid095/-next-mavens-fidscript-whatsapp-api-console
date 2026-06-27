/**
 * POST /api/instance/syncGroups/:name
 * Manually trigger a group sync for a connected instance.
 * Fetches all groups from the gateway and creates conversation entries for each.
 */
import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';
import { syncGroupsForInstance } from '../../services/whatsapp/groupSync.js';
import type { Instance } from '../../types.js';

const router = Router();

router.post('/syncGroups/:name', clientJwtAuth, async (req: Request, res: Response) => {
  const instanceName = req.params.name;

  const instance = db.prepare(`
    SELECT i.*, c.id as client_id
    FROM instances i JOIN clients c ON i.client_id = c.id
    WHERE i.name = ? AND i.client_id = ?
  `).get(instanceName, req.client!.id) as (Instance & { client_id: string }) | undefined;

  if (!instance) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  if (instance.status !== 'connected') {
    return res.status(400).json({ success: false, error: 'Instance is not connected. Connect first to sync groups.' });
  }

  try {
    const result = await syncGroupsForInstance(instance, instance.client_id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[groupSync] manual sync failed:', err);
    res.status(500).json({ success: false, error: 'Group sync failed' });
  }
});

export default router;
