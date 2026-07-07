import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callGateway, emitInstanceStateChange } from '../../utils/gateway.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// the gateway is inside Docker and can't reach public URLs — use internal hostname for webhooks
// Docker Compose normalizes service names to underscores in container names (whatsapp-api → fidscript_whatsapp_api)
const API_BASE_URL = process.env.API_INTERNAL_URL || 'http://fidscript_whatsapp_api:8080';

// GET /api/instance/connect/:name - Generate QR code from the gateway API
router.get('/connect/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }

    // Update status to connecting
    db.prepare("UPDATE instances SET status = 'connecting' WHERE name = ?").run(req.params.name);
    emitInstanceStateChange(req.params.name, 'connecting', null);

    // The WhatsApp API instance name is always req.params.name — evolution_name was the
    // old mapping that doesn't match what was actually created in the WhatsApp API.
    // Use req.params.name directly so we talk to the instance that exists in WhatsApp API.
    const evolutionInstanceName = req.params.name;

    // Set webhook for this instance so CONNECTION_UPDATE events are forwarded to us
    const webhookUrl = `${API_BASE_URL}/api/webhook/evolution`;
    callGateway('POST', `/webhook/set/${evolutionInstanceName}`, {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        headers: {},
        events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT'],
      },
    }).catch(err => console.warn('Failed to set webhook on instance:', err));

    // Apply saved settings to Evolution (all fields required by the API)
    const savedSettings = JSON.parse(instance.settings || '{}');
    const evoSettings = {
      rejectCall: Boolean(savedSettings.reject_calls ?? false),
      groupsIgnore: Boolean(savedSettings.groups_ignore ?? false),
      alwaysOnline: Boolean(savedSettings.always_online ?? false),
      readMessages: Boolean(savedSettings.read_messages ?? false),
      readStatus: Boolean(savedSettings.read_status ?? false),
      syncFullHistory: Boolean(savedSettings.sync_full_history ?? false),
      msgCall: String(savedSettings.msg_call ?? ''),
    };
    callGateway('POST', `/instance/settings/set/${evolutionInstanceName}`, evoSettings)
      .catch(err => console.warn(`[connect] failed to apply settings to Evolution for ${req.params.name}:`, err));

    const evoRes = await callGateway('GET', `/instance/connect/${evolutionInstanceName}`);

    // the gateway API v2: { qrcode: { code, base64, pairingCode, count } } or flat { code, base64, pairingCode }
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
