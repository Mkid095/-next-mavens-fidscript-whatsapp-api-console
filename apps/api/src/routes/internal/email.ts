/**
 * Internal email endpoints - the centralized, provider-agnostic way for any
 * backend service (or future cross-process worker) to send email.
 *
 *   POST /api/internal/email/send       - send a pre-rendered email
 *   POST /api/internal/email/template    - send a templated email
 *   GET  /api/internal/email/log         - recent send log (for diagnostics)
 *   GET  /api/internal/email/provider    - which provider is active
 *
 * No auth by design: these are internal-only routes. They MUST be mounted
 * behind a network policy (localhost bind, private subnet, or an auth
 * middleware in routes/index.ts) so they are unreachable from the public
 * internet.
 */
import { Router, type Request, type Response } from 'express';
import { emailService, recentEmailLog } from '../../services/email/index.js';
import type { TemplateVars } from '../../services/email/templates.js';

const router = Router();

interface RawBody { to?: string; subject?: string; html?: string; text?: string; template?: string }
type TemplateBody = TemplateVars & { to: string }

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text, template } = req.body as RawBody;
    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, error: 'to, subject, and html are required' });
    }
    const result = await emailService.send({ to, subject, html, text, template: template ?? null });
    return res.json({ success: result.success, data: { provider_id: result.providerId }, error: result.error });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/template', async (req: Request, res: Response) => {
  try {
    const body = req.body as TemplateBody;
    if (!body.to || !body.template) {
      return res.status(400).json({ success: false, error: 'to and template are required' });
    }
    const result = await emailService.sendTemplate(body);
    return res.json({ success: result.success, data: { provider_id: result.providerId }, error: result.error });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/log', (_req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(_req.query.limit) || 50, 200);
    return res.json({ success: true, data: recentEmailLog(limit) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/provider', (_req: Request, res: Response) => {
  return res.json({ success: true, data: { provider: emailService.providerName() } });
});

export default router;