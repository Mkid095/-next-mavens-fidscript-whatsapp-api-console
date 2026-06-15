import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = Router();

/**
 * POST /api/sandbox/exec
 * Proxy a real /api/v1 request using the client's own API key.
 * Accepts: { method, endpoint, pathParams?, body?, instanceName? }
 * Returns: the raw /api/v1 response
 */
router.post('/exec', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { method = 'GET', endpoint, pathParams, body, instanceName } = req.body as {
      method: string;
      endpoint: string;
      pathParams?: Record<string, string>;
      body?: Record<string, unknown>;
      instanceName?: string;
    };

    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'endpoint is required' });
    }

    // Look up the client's active API key (first active key found)
    const activeKey = db.prepare(
      `SELECT api_key FROM client_api_keys WHERE client_id = ? AND status = 'Active' ORDER BY created_at DESC LIMIT 1`
    ).get(req.client!.id) as { api_key: string } | undefined;

    if (!activeKey) {
      return res.status(400).json({ success: false, error: 'No active API key found. Generate one in API Keys first.' });
    }

    // Strip /api/v1 prefix — PUBLIC_API_BASE already includes it
    let v1Path = endpoint.replace(/^\/api\/v1/, '');
    if (instanceName && endpoint.includes(':instanceName')) {
      v1Path = v1Path.replace(':instanceName', encodeURIComponent(instanceName));
    }

    const apiBase = (process.env.PUBLIC_API_BASE || 'https://whatsapp.fidscript.com/api') + '/v1';
    const url = `${apiBase}${v1Path}`;

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': activeKey.key,
      },
    };

    if (!['GET', 'HEAD'].includes(fetchOptions.method!) && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const result = await fetch(url, fetchOptions);
    let data: Record<string, unknown> = {};
    try { Object.assign(data, await result.json()); } catch { /* ignore */ }
    const errorMsg = result.ok ? undefined : ('error' in data ? String(data.error) : `HTTP ${result.status}`);

    res.json({ success: result.ok, data, error: errorMsg });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/**
 * GET /api/sandbox/instances
 * List all instances for the client with their status — for the sandbox UI instance selector
 */
router.get('/instances', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instances = db.prepare(
      'SELECT id, name, display_name, status, phone_number, evolution_name FROM instances WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.client!.id);
    res.json({ success: true, data: instances });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
