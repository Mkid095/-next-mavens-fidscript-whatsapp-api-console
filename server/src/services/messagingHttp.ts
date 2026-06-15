import type { Request, Response } from 'express';
import { getInstanceForClient, type SendContext, type SendResult } from './messaging.js';

/**
 * Shared HTTP-layer helpers for messaging routes. Both the JWT dashboard routes
 * (routes/instance/messaging.ts) and the API-key public routes (routes/v1/messages.ts)
 * use these so the request → service → response wiring is identical.
 */

/** Build a SendContext for the named instance owned by req.client, or 404. */
export function buildSendCtx(req: Request, res: Response, name: string): SendContext | null {
  const instance = getInstanceForClient(name, req.client!.id);
  if (!instance) {
    res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    return null;
  }
  return { instance, client: req.client!, req };
}

/** Map a SendResult to the standard { success, data?, error? } response. */
export function respondSendResult(res: Response, result: SendResult): void {
  if (!result.ok) {
    res.status(result.status).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, data: result.data });
}
