import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';
import { callEvolutionAPI } from '../utils/evolution.js';
import { logApiRequest } from '../utils/audit.js';

const router = Router();

/**
 * POST /api/sandbox/exec
 * Proxy any Evolution API request for testing purposes.
 * Accepts: { method, endpoint, pathParams?, body?, instanceName? }
 * Returns: the raw Evolution API response
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

    // Build the full Evolution API path
    // If instanceName is provided and endpoint uses :instanceName, substitute it
    let evolutionPath = endpoint;
    if (instanceName && endpoint.includes(':instanceName')) {
      evolutionPath = endpoint.replace(':instanceName', instanceName);
    }

    // Call Evolution API
    const result = await callEvolutionAPI(method.toUpperCase(), evolutionPath, body || {});

    res.json({ success: true, data: result });
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
