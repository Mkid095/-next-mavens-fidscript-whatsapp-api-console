/**
 * sseClientHandler.ts - client SSE handler
 */
import type { Request, Response } from 'express';
import { paymentEmitter } from '../utils/paymentEmitter.js';
import { setSseHeaders, heartbeat } from './sseShared.js';
import { authSseToken } from './sseAuth.js';

export function handleClientSse(req: Request, res: Response): void {
  const auth = authSseToken(req);
  if (!auth) { res.status(401).json({ success: false, error: 'Invalid or expired token' }); return; }

  const decoded = auth.decoded!;
  setSseHeaders(res);
  res.write(': connected\n\n');

  const timer = heartbeat(res);

  const tokenUpdateHandler = (emittedClientId: string, data: { balance: number; transaction_id: string; mpesa_receipt?: string }) => {
    if (emittedClientId === decoded.id) res.write(`event: tokenUpdate\ndata: ${JSON.stringify(data)}\n\n`);
  };

  paymentEmitter.on('tokenUpdate', tokenUpdateHandler);

  req.on('close', () => {
    clearInterval(timer);
    paymentEmitter.off('tokenUpdate', tokenUpdateHandler);
  });
}
