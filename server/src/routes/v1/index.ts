import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { clientApiKeyAuth, clientRateLimit } from '../../middleware/auth.js';
import { V1_READ } from '../../middleware/auth/v1Limits.js';
import { v1VersionHeader } from '../../middleware/v1Version.js';
import messagesRouter from './messages.js';
import openapiRouter from './openapi.js';
import usageRouter from './usage.js';
import groupsRouter from './groups.js';
import chatsRouter from './chats.js';
import profileRouter from './profile.js';
import settingsRouter from './settings.js';

/**
 * Public API namespace — /api/v1.
 * Reserved for external integrators authenticating with an API key (X-API-Key).
 * The dashboard continues to use the JWT-guarded /api/instance routes.
 *
 * Layering (outer → inner): per-IP v1Limiter → clientApiKeyAuth (sets req.client)
 * → category rate limiter (V1_READ/V1_MUTATE/V1_STRICT or plan-based clientRateLimit
 * for sends) → route handler. Every response carries X-API-Version: v1.
 */
const router = Router();

// X-API-Version on every v1 response.
router.use(v1VersionHeader);

// Outer per-IP bucket applied to all v1 traffic.
const v1Limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, error: 'Public API rate limit exceeded' },
});

// Public OpenAPI spec (no auth; IP-limited).
router.use(v1Limiter, openapiRouter);

// GET /api/v1/whoami — validate an API key with no side effects.
router.get('/whoami', v1Limiter, clientApiKeyAuth, V1_READ, (req: Request, res: Response) => {
  res.json({ success: true, data: { client: req.client!.name, key_id: req.apiKeyId } });
});

// GET /api/v1/usage — aggregate usage for the authenticated client.
router.use('/usage', v1Limiter, clientApiKeyAuth, V1_READ, usageRouter);

// Messaging sends — plan-based rate limit (msg_per_min) on top of the IP bucket.
router.use('/messages', v1Limiter, clientApiKeyAuth, clientRateLimit, messagesRouter);

// Group management — free ops, V1_MUTATE limiter (auth applied per-route in the router).
router.use('/groups', v1Limiter, groupsRouter);

// Chat management — reads V1_READ, mutations V1_MUTATE (both free, no tokens).
router.use('/chats', v1Limiter, chatsRouter);

// Profile & privacy — reads V1_READ, updates V1_STRICT (both free, no tokens).
router.use('/profile', v1Limiter, profileRouter);

// Instance settings — reads V1_READ, updates V1_STRICT (both free, no tokens).
router.use('/settings', v1Limiter, settingsRouter);

export default router;
