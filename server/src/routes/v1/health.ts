/**
 * GET /api/v1/health — public health check
 * Returns { ok, version } so the CLI can verify connectivity.
 */
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const version = process.env.DEPLOY_VERSION ?? '1.0.0';
  res.json({ ok: true, version, service: 'fidscript-whatsapp-api' });
});

export default router;
