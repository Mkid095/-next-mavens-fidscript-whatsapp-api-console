import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { clientApiKeyAuth, clientRateLimit } from '../../middleware/auth.js';
import messagesRouter from './messages.js';

/**
 * Public API namespace — /api/v1.
 * Reserved for external integrators authenticating with an API key (X-API-Key).
 * The dashboard continues to use the JWT-guarded /api/instance routes.
 * v1Limiter is a per-IP outer bucket; clientRateLimit enforces the client's
 * plan msg_per_min on the cost-bearing endpoints.
 */
const router = Router();

const v1Limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, error: 'Public API rate limit exceeded' },
});

// GET /api/v1/whoami — validate an API key with no side effects (used by the
// dashboard "Test" button and by integrators to confirm a key is active).
router.get('/whoami', v1Limiter, clientApiKeyAuth, (req: Request, res: Response) => {
  res.json({ success: true, data: { client: req.client!.name, key_id: req.apiKeyId } });
});

router.use('/messages', v1Limiter, clientApiKeyAuth, clientRateLimit, messagesRouter);

export default router;

