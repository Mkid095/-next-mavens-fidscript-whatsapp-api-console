import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = Router();

/**
 * Determine auth mode + base URL for a given sandbox endpoint path.
 * Returns the resolved base URL and which auth header to apply.
 */
function resolveTarget(endpoint: string): { url: string; auth: 'apikey' | 'jwt' } | null {
  const apiBase = process.env.PUBLIC_API_BASE || 'https://whatsapp.fidscript.com/api';
  // Public v1 endpoints (API key auth)
  if (endpoint.startsWith('/api/v1')) {
    const stripped = endpoint.replace(/^\/api\/v1/, '');
    return { url: `${apiBase}/v1${stripped}`, auth: 'apikey' };
  }
  // Platform chatbot + LLM endpoints (JWT auth — uses the caller's session)
  if (endpoint.startsWith('/api/platform')) {
    return { url: `${apiBase}${endpoint}`, auth: 'jwt' };
  }
  // Sandbox + internal routes — reject (sandbox is for client-facing APIs only)
  return null;
}

/**
 * POST /api/sandbox/exec
 * Proxy a real /api/v1 (API key) or /api/platform (JWT) request.
 *
 * Accepts: { method, endpoint, instanceName?, keyId?, ...body }
 * Returns: { success, data, error? }
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

    // Resolve auth mode + URL
    const target = resolveTarget(ep);
    if (!target) {
      return res.status(400).json({ success: false, error: `Sandbox cannot proxy '${ep}'. Use /api/v1/* or /api/platform/* (chatbots, llm-connections).` });
    }

    // Substitute :instanceName
    let resolvedPath = ep;
    if (inst && ep.includes(':instanceName')) {
      resolvedPath = resolvedPath.replaceAll(':instanceName', encodeURIComponent(inst));
    }
    const finalTarget = resolveTarget(resolvedPath);
    if (!finalTarget) {
      return res.status(400).json({ success: false, error: 'Invalid endpoint' });
    }
    const url = finalTarget.url;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (target.auth === 'apikey') {
      // Look up the client's active API key
      let activeKey: { api_key: string } | undefined;
      if (kid) {
        activeKey = db.prepare(
          `SELECT api_key FROM client_api_keys WHERE id = ? AND client_id = ? AND status = 'Active'`
        ).get(kid, req.client!.id) as { api_key: string } | undefined;
      }
      if (!activeKey) {
        return res.status(400).json({ success: false, error: 'No active API key found. Generate one in API Keys first.' });
      }
      headers['X-API-Key'] = activeKey.api_key;
    } else {
      // JWT auth — read the caller's session token from the request
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'This /api/platform/* endpoint requires JWT auth. Run `fidscript login` first.' });
      }
      headers['Authorization'] = authHeader;
    }

    const fetchOptions: RequestInit = { method: httpMethod, headers };

    if (!['GET', 'HEAD'].includes(httpMethod) && Object.keys(rest).length > 0) {
      fetchOptions.body = JSON.stringify(rest);
    }

    const result = await fetch(url, fetchOptions);
    let data: Record<string, unknown> = {};
    try { Object.assign(data, await result.json()); } catch { /* ignore */ }
    const errorMsg = result.ok ? undefined : ('error' in data ? String(data.error) : `HTTP ${result.status}`);

    res.json({ success: result.ok, data, error: errorMsg, auth_used: target.auth });
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