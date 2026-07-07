/**
 * /api/platform/connectors — connector registry + credential management.
 *
 * GET  /connectors              — list available connectors + workspace install status
 * GET  /connectors/:slug        — get connector details + credential status
 * POST /connectors/:slug/credentials — store encrypted OAuth/API-key credentials
 * DELETE /connectors/:slug/credentials — revoke credentials
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return req.client!.id;
}

// ─── Registry lazy-loader (avoids circular / expensive init) ───────────────────

async function getRegistry() {
  const { ConnectorRegistry } = await import('../../modules/ai/connectors/registry.js');
  return ConnectorRegistry;
}

// ─── GET /connectors ───────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const registry = await getRegistry();
    const connectors = registry.all();

    const installed = db.prepare(
      'SELECT connector_id FROM connector_credentials WHERE workspace_id = ? AND revoked_at IS NULL'
    ).all(wsId(req)) as { connector_id: string }[];
    const installedSet = new Set(installed.map(r => r.connector_id));

    res.json({
      success: true,
      data: connectors.map(c => ({
        id: c.id,
        slug: c.slug,
        authType: c.authType,
        triggers: c.triggers,
        actions: c.actions,
        installed: installedSet.has(c.id),
        docsUrl: c.docsUrl,
        installUrl: c.installUrl,
      })),
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── GET /connectors/:slug ────────────────────────────────────────────────────

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const registry = await getRegistry();
    const cfg = registry.get(req.params.slug);
    if (!cfg) {
      res.status(404).json({ success: false, error: 'Connector not found' });
      return;
    }

    const cred = db.prepare(
      'SELECT id, expires_at FROM connector_credentials WHERE connector_id = ? AND workspace_id = ? AND revoked_at IS NULL'
    ).get(cfg.id, wsId(req)) as { id: string; expires_at?: string } | undefined;

    res.json({
      success: true,
      data: {
        ...cfg,
        // Strip tool params_json from detail view (sensitive)
        tools: cfg.tools.map(t => ({ name: t.name, description: t.description })),
        credentialsStored: !!cred,
        expiresAt: cred?.expires_at ?? null,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── POST /connectors/:slug/credentials ────────────────────────────────────────

router.post('/:slug/credentials', async (req: Request, res: Response) => {
  try {
    const { access_token, refresh_token, expires_in, shop } = req.body as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      shop?: string;
    };

    const registry = await getRegistry();
    const cfg = registry.get(req.params.slug);
    if (!cfg) {
      res.status(404).json({ success: false, error: 'Connector not found' });
      return;
    }
    if (!access_token) {
      res.status(400).json({ success: false, error: 'access_token required' });
      return;
    }

    // Encrypt token before storing
    const key = process.env.CONNECTOR_SECRET
      || process.env.ENCRYPTION_KEY
      || 'dev-secret-32-chars-long-herexxxx';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), iv);
    const encrypted = Buffer.concat([cipher.update(access_token, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag().toString('hex');
    const encryptedB64 = Buffer.concat([iv, encrypted]).toString('base64');

    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined;

    // Revoke any previous credential for this workspace+connector first
    db.prepare(
      "UPDATE connector_credentials SET revoked_at = datetime('now') WHERE connector_id = ? AND workspace_id = ? AND revoked_at IS NULL"
    ).run(cfg.id, wsId(req));

    const id = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO connector_credentials
        (id, connector_id, workspace_id, encrypted_token, iv, auth_tag, expires_at, extra_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      cfg.id,
      wsId(req),
      encryptedB64,
      iv.toString('hex'),
      authTag,
      expiresAt ?? null,
      JSON.stringify({ shop: shop ?? '', workspace_id: wsId(req) }),
    );

    res.status(201).json({ success: true, id });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── DELETE /connectors/:slug/credentials ─────────────────────────────────────

router.delete('/:slug/credentials', async (req: Request, res: Response) => {
  try {
    const registry = await getRegistry();
    const cfg = registry.get(req.params.slug);
    if (!cfg) {
      res.status(404).json({ success: false, error: 'Connector not found' });
      return;
    }

    db.prepare(
      "UPDATE connector_credentials SET revoked_at = datetime('now') WHERE connector_id = ? AND workspace_id = ? AND revoked_at IS NULL"
    ).run(cfg.id, wsId(req));

    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
