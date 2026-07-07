import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callGateway, emitInstanceStateChange } from '../../utils/gateway.js';

const router = Router();

// GET /api/instance/connectionState/:name - Get connection state from the gateway API
router.get('/connectionState/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    if (instance.client_id !== req.client?.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    let evoState = 'unknown';
    let phoneNumber: string | null = null;
    try {
      // WhatsApp API instance name is always req.params.name
      const evolutionInstanceName = req.params.name;
      const evoRes = await callGateway('GET', `/instance/connectionState/${evolutionInstanceName}`);
      // the gateway API v2: { instance: { state, phone, ... } }
      const inst = (evoRes.instance as { state?: string; phone?: string; phone_number?: string } | undefined) || evoRes;
      evoState = inst?.state || 'unknown';
      if (inst?.state === 'open') {
        evoState = 'connected';
        phoneNumber = (inst?.phone as string | undefined) || (inst?.phone_number as string | undefined) || null;
      } else if (inst?.state === 'close') {
        evoState = 'disconnected';
      } else if (inst?.state === 'connecting') {
        evoState = 'connecting';
      }
    } catch (evoErr) {
      console.error('Failed to get the gateway API connection state:', evoErr);
    }

    // Update local status and phone if different
    if (instance.status !== evoState || (phoneNumber && instance.phone_number !== phoneNumber)) {
      db.prepare('UPDATE instances SET status = ?, phone_number = COALESCE(?, phone_number) WHERE name = ?').run(evoState, phoneNumber, req.params.name);
      // Emit SSE event for real-time updates
      emitInstanceStateChange(req.params.name, evoState, phoneNumber);
    }

    res.json({
      success: true,
      data: { name: instance.name, status: evoState, phone_number: phoneNumber, qr_code: instance.qr_code },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch connection state' });
  }
});

export default router;
