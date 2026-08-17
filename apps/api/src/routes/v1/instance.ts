import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_MUTATE, V1_STRICT } from '../../middleware/auth/v1Limits.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import type { SendContext, SendResult } from '../../services/whatsapp/shared.js';
import { connectionState, logout, setPresence, restart, connectInstance, connectWithLogout } from '../../services/whatsapp/instanceOps.js';

/**
 * /api/v1/instance/* - connection lifecycle. No tokens (free).
 * Reads get V1_MUTATE (120/min), restart/logout get V1_STRICT (30/min).
 * Restart requires explicit confirmation via body.confirm=true or
 * X-Confirm-Restart: true header (428 if missing).
 */
const router = Router();
const authMutate = [clientApiKeyAuth, V1_MUTATE];
const authStrict = [clientApiKeyAuth, V1_STRICT];

type Handler = (ctx: SendContext, req: Request) => Promise<SendResult>;
function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    const ctx = buildSendCtx(req, res, req.params.instance);
    if (!ctx) return;
    try { respondSendResult(res, await handler(ctx, req)); }
    catch (e) { console.error('instance error:', e); res.status(500).json({ success: false, error: 'Instance operation failed' }); }
  };
}

router.get('/connection-state/:instance', ...authMutate, wrap((c) => connectionState(c)));
router.get('/connect/:instance', ...authMutate, wrap((c, r) => connectWithLogout(c, r.query.number ? String(r.query.number) : undefined)));
router.get('/qr/:instance', ...authMutate, wrap((c, r) => connectInstance(c, r.query.number ? String(r.query.number) : undefined)));
router.post('/restart/:instance', ...authStrict, async (req: Request, res: Response) => {
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  const confirm = req.body?.confirm === true || req.headers['x-confirm-restart'] === 'true';
  if (!confirm) {
    res.status(428).json({ success: false, error: 'Restart requires {"confirm":true} in the request body or X-Confirm-Restart: true header' });
    return;
  }
  try { respondSendResult(res, await restart(ctx)); }
  catch (e) { console.error('restart error:', e); res.status(500).json({ success: false, error: 'Restart failed' }); }
});
router.delete('/logout/:instance', ...authStrict, wrap((c) => logout(c)));
router.post('/set-presence/:instance', ...authMutate, wrap(async (c, r) => {
  const presence = (r.body.presence as string) || 'available';
  if (presence !== 'available' && presence !== 'unavailable') {
    return { ok: false, status: 400, error: 'presence must be "available" or "unavailable"' };
  }
  return setPresence(c, presence as 'available' | 'unavailable');
}));

export default router;
