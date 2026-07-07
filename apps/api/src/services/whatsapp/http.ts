import type { Request, Response } from 'express';
import { getInstanceForClient, isOkResult, type SendContext, type SendResult } from './shared.js';
import type { AuthenticatedRequest } from '../../modules/platform/workspace/context.js';

/**
 * Shared HTTP-layer helpers for messaging routes. Both the JWT dashboard routes
 * (routes/instance/messaging.ts) and the API-key public routes (routes/v1/messages.ts)
 * use these so the request → service → response wiring is identical.
 */

/** Build a SendContext for the named instance owned by req.client (or workspaceId as fallback), or 404. */
export function buildSendCtx(req: Request, res: Response, name: string): SendContext | null {
  // Prefer req.client.id; fall back to workspaceId (used by platform routes that
  // authenticate via workspaceAuth which does not populate req.client).
  const authReq = req as AuthenticatedRequest;
  const clientId = req.client?.id ?? authReq.workspace?.workspaceId;
  if (!clientId) {
    res.status(401).json({ success: false, error: 'Client context not found' });
    return null;
  }
  const instance = getInstanceForClient(name, clientId);
  if (!instance) {
    res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    return null;
  }
  // Reconstruct a minimal client object so ctx.client.id works in downstream code.
  const client = req.client ?? ({ id: clientId } as NonNullable<typeof req.client>);
  return { instance, client: client!, req };
}

/** Map a SendResult to the standard { success, data?, error? } response. */
export function respondSendResult(res: Response, result: SendResult): void {
  if (isOkResult(result)) {
    res.json({ success: true, data: result.data });
    return;
  }
  res.status(result.status).json({ success: false, error: result.error });
}
