import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();
router.use(adminAuth);

/**
 * GET /api/admin/keys
 * List all platform-level admin API keys (masked).
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const keys = db.prepare(
      'SELECT id, name, substr(api_key, 1, 20) as key_prefix, status, created_by, created_at, last_used FROM admin_api_keys ORDER BY created_at DESC'
    ).all();
    res.json({ success: true, data: keys });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/**
 * POST /api/admin/keys
 * Create a new platform-level admin API key.
 * Body: { name: string }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }

    const apiKey = `fidscript_admin_${crypto.randomBytes(16).toString('hex')}`;
    const id = `admkey_${uuidv4()}`;
    const keyHash = bcrypt.hashSync(apiKey, 10);
    const adminId = (req as unknown as { user?: { id: string } }).user?.id ?? 'system';

    db.prepare(
      'INSERT INTO admin_api_keys (id, name, api_key, key_hash, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name.trim(), apiKey, keyHash, adminId);

    logAuditAction(req, 'ADMIN_API_KEY_CREATED', 'admin_api_key', id, JSON.stringify({
      after: { id, name, key_prefix: apiKey.substring(0, 20) }
    }));

    res.json({
      success: true,
      data: {
        id,
        name: name.trim(),
        key: apiKey,
        status: 'Active',
        created_by: adminId,
        created_at: new Date().toISOString(),
        last_used: null,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/**
 * DELETE /api/admin/keys/:id
 * Revoke (soft-delete) an admin API key.
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, status FROM admin_api_keys WHERE id = ?').get(id) as
      { id: string; status: string } | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Key not found' });
      return;
    }
    if (existing.status === 'Revoked') {
      res.status(400).json({ success: false, error: 'Key already revoked' });
      return;
    }

    db.prepare('UPDATE admin_api_keys SET status = ? WHERE id = ?').run('Revoked', id);

    logAuditAction(req, 'ADMIN_API_KEY_REVOKED', 'admin_api_key', id, JSON.stringify({
      before: { status: existing.status },
      after: { status: 'Revoked' }
    }));

    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
