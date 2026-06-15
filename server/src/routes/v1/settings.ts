import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ, V1_STRICT } from '../../middleware/auth/v1Limits.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import type { SendContext, SendResult } from '../../services/whatsapp/shared.js';
import { findSettings, setSettings } from '../../services/whatsapp/profile.js';

const router = Router();
const authRead = [clientApiKeyAuth, V1_READ];
const authStrict = [clientApiKeyAuth, V1_STRICT];

type Handler = (ctx: SendContext, req: Request) => Promise<SendResult>;
function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    const ctx = buildSendCtx(req, res, req.params.instance);
    if (!ctx) return;
    try { respondSendResult(res, await handler(ctx, req)); }
    catch (e) { console.error('settings error:', e); res.status(500).json({ success: false, error: 'Settings operation failed' }); }
  };
}

router.get('/find/:instance', ...authRead, wrap((c) => findSettings(c)));
router.post('/set/:instance', ...authStrict, wrap((c, r) => setSettings(c, r.body)));

export default router;
