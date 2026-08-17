import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ, V1_STRICT } from '../../middleware/auth/v1Limits.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import type { SendContext, SendResult } from '../../services/whatsapp/shared.js';
import * as profile from '../../services/whatsapp/profile.js';

/**
 * /api/v1/profile/* - profile, privacy & settings. Reads get V1_READ (600/min),
 * updates get V1_STRICT (30/min). All FREE (no tokens).
 */
const router = Router();
const authRead = [clientApiKeyAuth, V1_READ];
const authStrict = [clientApiKeyAuth, V1_STRICT];

type Handler = (ctx: SendContext, req: Request) => Promise<SendResult>;
function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    const ctx = buildSendCtx(req, res, req.params.instance);
    if (!ctx) return;
    try { respondSendResult(res, await handler(ctx, req)); }
    catch (e) { console.error('profile error:', e); res.status(500).json({ success: false, error: 'Profile operation failed' }); }
  };
}

router.get('/fetch/:instance', ...authRead, wrap((c, r) => profile.fetchProfile(c, String(r.query.number))));
router.get('/fetch-privacy/:instance', ...authRead, wrap((c) => profile.fetchPrivacySettings(c)));
router.post('/update-name/:instance', ...authStrict, wrap((c, r) => profile.updateProfileName(c, String(r.body.name))));
router.post('/update-status/:instance', ...authStrict, wrap((c, r) => profile.updateProfileStatus(c, String(r.body.status))));
router.post('/update-picture/:instance', ...authStrict, wrap((c, r) => profile.updateProfilePicture(c, String(r.body.picture))));
router.delete('/remove-picture/:instance', ...authStrict, wrap((c) => profile.removeProfilePicture(c)));

export default router;
