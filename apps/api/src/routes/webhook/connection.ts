import type { Request, Response } from 'express';
import db from '../../database.js';
import { callGateway, emitInstanceStateChange } from '../../utils/gateway.js';
import { logAuditAction } from '../../utils/audit.js';
import { extractPhoneFromJid, type WebhookInstance } from './shared.js';

// connection.update - instance connected/connecting/disconnected.
export async function handleConnectionUpdate(
  instance: WebhookInstance,
  decodedName: string,
  data: Record<string, unknown> | undefined,
  req: Request,
  res: Response,
): Promise<void> {
  const state = data?.state as string | undefined;
  const wuid = data?.wuid as string | undefined;

  const status: 'connected' | 'connecting' | 'disconnected' =
    state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected';

  let phoneNumber: string | null = wuid ? extractPhoneFromJid(wuid) : null;

  // Fallback: fetch from the gateway if not in payload
  if (!phoneNumber && status === 'connected') {
    try {
      const evoName = instance.evolution_name || decodedName;
      const evoRes = await callGateway('GET', `/instance/connectionState/${evoName}`);
      const inst = (evoRes.instance as { state?: string; phone?: string; phone_number?: string } | undefined) || evoRes;
      phoneNumber = (inst?.phone as string | undefined) || (inst?.phone_number as string | undefined) || null;
    } catch { /* leave null */ }
  }

  db.prepare('UPDATE instances SET status = ?, phone_number = ?, last_active = ? WHERE name = ?')
    .run(status, phoneNumber, new Date().toISOString(), instance.name);
  logAuditAction(req, 'CONNECTION_STATE', 'instance', String(instance.id), `Webhook: ${instance.name} -> ${status}`);
  emitInstanceStateChange(instance.name, status, phoneNumber);
  res.status(200).json({ success: true, handled: true });
}
