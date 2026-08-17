import { Router, Request, Response } from 'express';
import db from '../../database.js';
import type { WebhookInstance } from './shared.js';
import { handleConnectionUpdate } from './connection.js';
import { handleMessagesUpsert } from './messages.js';
import { handleMessagesReceipt, handlePresenceUpdate } from './receipt.js';

// POST /api/webhook/evolution - the gateway API event ingress.
// No auth: reachable only from the the gateway server (private URL). Dispatches
// to per-event handlers; each responds + persists + emits as needed.
const router = Router();

router.post('/evolution', async (req: Request, res: Response) => {
  const rawBody = req.body as { event?: string; instance?: string; data?: Record<string, unknown>; sender?: string };
  const { event, instance: instanceName } = rawBody;
  const decodedName = instanceName ? decodeURIComponent(instanceName) : '';

  const instance = decodedName
    ? (db.prepare('SELECT id, name, client_id, evolution_name FROM instances WHERE name = ? OR evolution_name = ?')
        .get(decodedName, decodedName) as WebhookInstance | undefined)
    : undefined;

  if (!instance) {
    res.status(200).json({ success: true, handled: false, reason: 'instance_not_found' });
    return;
  }

  const { data, sender } = rawBody;

  switch (event) {
    case 'connection.update':
      return handleConnectionUpdate(instance, decodedName, data, req, res);
    case 'messages.upsert':
      return handleMessagesUpsert(instance, data, sender, rawBody, req, res);
    case 'messages.receipt':
      return handleMessagesReceipt(instance, data, res);
    case 'presence.update':
      return handlePresenceUpdate(instance, data, res);
    default:
      res.status(200).json({ success: true, handled: false });
  }
});

export default router;
