import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
    const keyHash = bcrypt.hashSync(apiKey, 10);
    db.prepare(
      'INSERT INTO client_api_keys (id, client_id, name, api_key, key_hash) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.client!.id, name, apiKey, keyHash);
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

// Regenerate API key — issues a new secret, returns it ONCE (rotates the row).
// Lets owners recover/copy access again without permanently exposing keys via GET.
router.post('/:id/regenerate', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT id FROM client_api_keys WHERE id = ? AND client_id = ? AND status = ?')
      .get(req.params.id, req.client!.id, 'Active') as { id: string } | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Active key not found' });
    }
    const apiKey = `fidscript_live_${crypto.randomBytes(16).toString('hex')}`;
    const keyHash = bcrypt.hashSync(apiKey, 10);
    db.prepare('UPDATE client_api_keys SET api_key = ?, key_hash = ?, created_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?')
      .run(apiKey, keyHash, req.params.id, req.client!.id);
    res.json({ success: true, data: { id: req.params.id, key: apiKey } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
