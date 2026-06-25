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
    const { method, endpoint, instanceName, keyId, ...rest } = req.body as Record<string, unknown>;
    const httpMethod = (typeof method === 'string' ? method : 'GET') as 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    const ep = typeof endpoint === 'string' ? endpoint : '';
    const inst = typeof instanceName === 'string' ? instanceName : '';
    const kid = typeof keyId === 'string' ? keyId : '';

    if (!ep) {
      return res.status(400).json({ success: false, error: 'endpoint is required' });
    }

    // Look up the client's active API key by ID
    let activeKey: { api_key: string } | undefined;
    if (kid) {
      activeKey = db.prepare(
        `SELECT api_key FROM client_api_keys WHERE id = ? AND client_id = ? AND status = 'Active'`
      ).get(kid, req.client!.id) as { api_key: string } | undefined;
    }
    if (!activeKey) {
      return res.status(400).json({ success: false, error: 'No active API key found. Generate one in API Keys first.' });
    }

    // Strip /api/v1 prefix — PUBLIC_API_BASE already includes it
    let v1Path = ep.replace(/^\/api\/v1/, '');
    if (inst && ep.includes(':instanceName')) {
      v1Path = v1Path.replace(':instanceName', encodeURIComponent(inst));
    }

    const apiBase = (process.env.PUBLIC_API_BASE || 'https://whatsapp.fidscript.com/api') + '/v1';
    const url = `${apiBase}${v1Path}`;

    const fetchOptions: RequestInit = {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': activeKey.api_key,
      },
    };

    if (!['GET', 'HEAD'].includes(httpMethod) && Object.keys(rest).length > 0) {
      fetchOptions.body = JSON.stringify(rest);
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
 * GET /api/sandbox/key/:keyId
 * Return the full API key for a given key ID — for the Vibe Wizard prompt generator.
 * The key is looked up server-side so the secret never has to be stored client-side.
 */
router.get('/key/:keyId', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const key = db.prepare(
      'SELECT api_key FROM client_api_keys WHERE id = ? AND client_id = ? AND status = \'Active\''
    ).get(req.params.keyId, req.client!.id) as { api_key: string } | undefined;
    if (!key) {
      return res.status(404).json({ success: false, error: 'Key not found or inactive' });
    }
    res.json({ success: true, api_key: key.api_key });
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
