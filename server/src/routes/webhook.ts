import { Router, Request, Response } from 'express';
import db from '../database.js';
import { callEvolutionAPI, emitInstanceStateChange } from '../utils/evolution.js';
import { logAuditAction } from '../utils/audit.js';

const router = Router();

// Evolution API sends this header to authenticate webhook calls
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8';

/**
 * POST /api/webhook/evolution
 * Receives CONNECTION_UPDATE (and other) events forwarded by Evolution API.
 * Authenticated via X-API-Key header matching our Evolution API key.
 */
router.post('/evolution', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey !== EVOLUTION_API_KEY) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { event, instance: instanceName, data } = req.body as {
    event: string;
    instance: string;
    data: { state?: string; phone?: string; phone_number?: string; qrcode?: unknown };
  };

  if (!instanceName) {
    res.status(400).json({ success: false, error: 'Missing instance name' });
    return;
  }

  // Only handle connection state events
  if (event !== 'connection.update') {
    res.status(200).json({ success: true, handled: false });
    return;
  }

  const state = data?.state as string | undefined;

  // Map Evolution state values to our status values
  let status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  if (state === 'open') {
    status = 'connected';
  } else if (state === 'connecting') {
    status = 'connecting';
  } else {
    status = 'disconnected';
  }

  // Find instance by name OR evolution_name (Evolution API sends evolution_name as instance identifier)
  const decodedName = decodeURIComponent(instanceName);
  const instance = db.prepare(
    'SELECT * FROM instances WHERE name = ? OR evolution_name = ?'
  ).get(decodedName, decodedName) as { id: number; name: string; evolution_name?: string } | undefined;
  if (!instance) {
    // Instance may not exist in our DB yet — ignore
    res.status(200).json({ success: true, handled: false, reason: 'instance_not_found' });
    return;
  }

  // Phone number is not in the CONNECTION_UPDATE payload — fetch it from connectionState
  let phoneNumber: string | null = null;
  if (status === 'connected') {
    try {
      const evoName = instance.evolution_name || decodedName;
      const evoRes = await callEvolutionAPI('GET', `/instance/connectionState/${evoName}`);
      const inst = (evoRes.instance as { state?: string; phone?: string; phone_number?: string } | undefined) || evoRes;
      phoneNumber = (inst?.phone as string | undefined) || (inst?.phone_number as string | undefined) || null;
    } catch {
      // Phone number fetch failed — leave as null
    }
  }

  // Update instance status and phone number in DB (use our instance name, not evolution name)
  db.prepare('UPDATE instances SET status = ?, phone_number = ? WHERE name = ?').run(status, phoneNumber, instance.name);
  logAuditAction(req, 'CONNECTION_STATE', 'instance', String(instance.id), `Webhook: ${instance.name} -> ${status}`);

  // Broadcast to any SSE subscribers (use our instance name for SSE matching)
  emitInstanceStateChange(instance.name, status, phoneNumber);

  res.status(200).json({ success: true, handled: true });
});

export default router;
