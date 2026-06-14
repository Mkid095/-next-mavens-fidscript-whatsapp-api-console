import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import adminAuthRouter from './adminAuth.js';
import clientAuthRouter from './clientAuth.js';
import clientMeRouter from './clientMe.js';
import clientTokensRouter from './clientTokens.js';
import magicAuthRouter from './magicAuth.js';
import clientMagicAuthRouter from './clientMagicAuth.js';

const router = Router();

// Per-IP rate limit for the passwordless magic-code endpoints. Throttles
// code-request spam (Resend cost / inbox-spam abuse) and verify brute-force,
// on top of the per-email and per-code limits enforced in authCodes.ts.
const magicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});

router.use('/', adminAuthRouter);
router.use('/', clientAuthRouter);
router.use('/', clientMeRouter);
router.use('/', clientTokensRouter);
router.use('/', magicLimiter, magicAuthRouter);
router.use('/', magicLimiter, clientMagicAuthRouter);

export default router;
