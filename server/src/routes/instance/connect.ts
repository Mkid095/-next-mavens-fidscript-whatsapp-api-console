import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callEvolutionAPI, emitInstanceStateChange } from '../../utils/evolution.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

const API_BASE_URL = process.env.API_URL || 'https://apiwhatsapp.fidscript.com';

// GET /api/instance/connect/:name - Generate QR code from Evolution API
router.get('/connect/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }

    // Update status to connecting
    db.prepare("UPDATE instances SET status = 'connecting' WHERE name = ?").run(req.params.name);
    emitInstanceStateChange(req.params.name, 'connecting', null);

    // Use stored evolution_name or construct fallback
    const evolutionInstanceName = instance.evolution_name || `${req.client?.id}_${req.params.name}`;

    // Set webhook for this instance so CONNECTION_UPDATE events are forwarded to us
    const webhookUrl = `${API_BASE_URL}/api/webhook/evolution`;
    callEvolutionAPI('POST', `/webhook/set/${evolutionInstanceName}`, {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        headers: {},
        events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT'],
      },
    }).catch(err => console.warn('Failed to set webhook on instance:', err));

    const evoRes = await callEvolutionAPI('GET', `/instance/connect/${evolutionInstanceName}`);

    // Evolution API v2: { qrcode: { code, base64, pairingCode, count } } or flat { code, base64, pairingCode }
    const qrData = (evoRes.qrcode as { code?: string; base64?: string; pairingCode?: string; link_code?: string } | undefined) || evoRes;
    const qrCode = qrData?.base64 || qrData?.code || '';
    const pairingCode = qrData?.pairingCode || qrData?.link_code || null;

    db.prepare('UPDATE instances SET qr_code = ? WHERE name = ?').run(qrCode, req.params.name);
    logAuditAction(req, 'CONNECT', 'instance', instance.id, `QR code generated for ${req.params.name}`);

    res.json({
      success: true,
      data: { qrcode: qrCode, qrcode_image: qrCode, expires_in: 60, created_at: new Date().toISOString() },
    });
  } catch (error) {
    // Revert status on failure
    db.prepare("UPDATE instances SET status = 'disconnected' WHERE name = ?").run(req.params.name);
    console.error('Failed to generate QR code:', error);
    res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
});

export default router;
