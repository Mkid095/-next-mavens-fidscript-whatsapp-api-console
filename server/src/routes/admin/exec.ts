import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import { callEvolutionAPI } from '../../utils/evolution.js';

const router = Router();

/**
 * POST /api/admin/exec
 * Admin raw gateway executor — proxies any request directly to the Evolution API
 * using the server's own API key. Lets admins test arbitrary Evolution endpoints
 * without needing a client API key.
 *
 * Body: { method: string, path: string (Evolution path, e.g. "/message/sendText/myinst"), body?: object }
 */
router.post('/exec', adminAuth, async (req: Request, res: Response) => {
  try {
    const { method, path, body } = req.body as {
      method?: string;
      path?: string;
      body?: Record<string, unknown>;
    };

    if (!method || !path) {
      res.status(400).json({ success: false, error: 'method and path are required' });
      return;
    }

    const result = await callEvolutionAPI(
      method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      path,
      body
    );
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
