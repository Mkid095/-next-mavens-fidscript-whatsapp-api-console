import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = Router();

// List API keys for client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const keys = db.prepare(
      'SELECT id, name, substr(api_key, 1, 20) as key_prefix, status, created_at, last_used FROM client_api_keys WHERE client_id = ?'
    ).all(req.client!.id);
    res.json({ success: true, data: keys });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Create new API key
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'name required' });
  }
  try {
    const apiKey = `fidscript_live_${crypto.randomBytes(16).toString('hex')}`;
    const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    db.prepare(
      'INSERT INTO client_api_keys (id, client_id, name, api_key) VALUES (?, ?, ?, ?)'
    ).run(id, req.client!.id, name, apiKey);
    res.json({ success: true, data: { id, name, key: apiKey, status: 'Active', created_at: new Date().toISOString() } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Revoke API key
router.delete('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    db.prepare('UPDATE client_api_keys SET status = ? WHERE id = ? AND client_id = ?')
      .run('Revoked', req.params.id, req.client!.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
