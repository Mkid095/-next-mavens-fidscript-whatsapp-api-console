/**
 * Workspace LLM Connections — /api/platform/llm-connections
 *
 * Per-workspace connections referencing admin-managed llm_provider_registry.
 * Each connection binds a workspace to a provider + model combination.
 */
import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { encryptApiKey, maskApiKey } from '../../utils/crypto.js';
import db from '../../database.js';
import { saveDatabase } from '../../database.js';

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

// ─── List workspace connections ────────────────────────────────────────────────
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT lc.*,
             lpr.name as provider_name,
             lpr.provider_type,
             lpr.base_url,
             lpr.is_free_tier,
             lpr.is_default as registry_is_default
      FROM llm_connections lc
      LEFT JOIN llm_provider_registry lpr ON lpr.id = lc.provider_registry_id
      WHERE lc.workspace_id = ?
      ORDER BY lc.is_default DESC, lc.created_at DESC
    `).all(wsId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Create connection ─────────────────────────────────────────────────────────
router.post('/', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const {
      provider,
      provider_registry_id,
      model,
      api_key,
      endpoint = '',
      is_default = false,
      monthly_limit = 0,
      priority = 0,
    } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'provider is required' });
    }

    // Validate provider_registry_id exists and is enabled
    if (provider_registry_id) {
      const reg = db.prepare(
        'SELECT * FROM llm_provider_registry WHERE id = ? AND enabled = 1'
      ).get(provider_registry_id);
      if (!reg) {
        return res.status(400).json({ success: false, error: 'Invalid or disabled provider registry ID' });
      }
    }

    const id = `llmc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let apiKeyLast4 = '';
    let iv = '';
    let authTag = '';
    let encryptedKey = '';

    if (api_key) {
      const enc = encryptApiKey(api_key);
      iv = enc.iv;
      authTag = enc.authTag;
      encryptedKey = enc.ciphertext;
      apiKeyLast4 = maskApiKey(api_key).replace('sk-****', '');
    }

    // If setting as default, clear other defaults for this workspace+provider
    if (is_default) {
      db.prepare(
        'UPDATE llm_connections SET is_default = 0 WHERE workspace_id = ? AND provider = ?'
      ).run(workspaceId, provider);
    }

    db.prepare(`INSERT INTO llm_connections
      (id, workspace_id, provider, provider_registry_id, model, api_key_encrypted, api_key_last4,
       iv, auth_tag, key_version, endpoint, is_default, monthly_limit, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, workspaceId, provider, provider_registry_id ?? null, model ?? '',
      encryptedKey, apiKeyLast4, iv, authTag, 1, endpoint,
      is_default ? 1 : 0, monthly_limit, priority
    );

    res.status(201).json({ success: true, data: { id }, message: 'Connection created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Update connection ────────────────────────────────────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const conn = db.prepare(
      'SELECT * FROM llm_connections WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!conn) { res.status(404).json({ success: false, error: 'Connection not found' }); return; }

    const { model, endpoint, api_key, is_default, monthly_limit, priority, enabled } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (model !== undefined)            { updates.push('model = ?'); params.push(model); }
    if (endpoint !== undefined)        { updates.push('endpoint = ?'); params.push(endpoint); }
    if (monthly_limit !== undefined)   { updates.push('monthly_limit = ?'); params.push(monthly_limit); }
    if (priority !== undefined)         { updates.push('priority = ?'); params.push(priority); }
    if (enabled !== undefined)          { updates.push('enabled = ?'); params.push(enabled ? 1 : 0); }

    if (is_default !== undefined) {
      if (is_default) {
        db.prepare('UPDATE llm_connections SET is_default = 0 WHERE workspace_id = ? AND provider = ?')
          .run(workspaceId, (conn as { provider: string }).provider);
      }
      updates.push('is_default = ?');
      params.push(is_default ? 1 : 0);
    }

    if (api_key) {
      const enc = encryptApiKey(api_key);
      updates.push('api_key_encrypted = ?', 'api_key_last4 = ?', 'iv = ?', 'auth_tag = ?', 'key_version = key_version + 1');
      params.push(enc.ciphertext, maskApiKey(api_key).replace('sk-****', ''), enc.iv, enc.authTag);
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No changes' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    db.prepare(`UPDATE llm_connections SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true, message: 'Connection updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Delete connection ────────────────────────────────────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const conn = db.prepare(
      'SELECT * FROM llm_connections WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!conn) { res.status(404).json({ success: false, error: 'Connection not found' }); return; }

    db.prepare('DELETE FROM llm_connections WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Connection deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Test connection ───────────────────────────────────────────────────────────
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const conn = db.prepare(
      'SELECT * FROM llm_connections WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId) as {
      id: string; provider: string; api_key_encrypted: string; iv: string;
      auth_tag: string; key_version: number; model: string; endpoint: string;
    } | undefined;

    if (!conn) { res.status(404).json({ success: false, error: 'Connection not found' }); return; }

    if (!conn.api_key_encrypted) {
      return res.json({ success: false, error: 'No API key configured on this connection' });
    }

    try {
      const { LLMGateway } = await import('../../modules/ai/llmGateway.js');
      const testGw = LLMGateway.resolve('', workspaceId, { forceProvider: conn.provider, forceConnectionId: conn.id });
      await testGw.call({
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 5,
      });

      res.json({ success: true, message: 'Connection verified successfully' });
    } catch (llmErr) {
      res.json({ success: false, error: String(llmErr) });
    }
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Get available providers (from registry) ──────────────────────────────────
router.get('/available-providers', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, provider_type, name, description, base_url, is_free_tier, is_default
      FROM llm_provider_registry
      WHERE enabled = 1
      ORDER BY is_default DESC, name ASC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
