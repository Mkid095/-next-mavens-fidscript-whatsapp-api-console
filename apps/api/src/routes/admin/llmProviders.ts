/**
 * Admin LLM Provider Management — /api/admin/llm-providers
 *
 * CRUD for global LLM provider registry (admin-managed).
 * Providers are template definitions that workspaces reference.
 */
import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import { encryptApiKey, maskApiKey } from '../../utils/crypto.js';
import db from '../../database.js';

const router = Router();
router.use(adminAuth);

// ─── List all providers ────────────────────────────────────────────────────────
router.get('/providers', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, provider_type, name, description, base_url, auth_type,
             api_key_last4, is_default, is_free_tier, free_quota_tokens,
             config_json, enabled, created_at, updated_at
      FROM llm_provider_registry
      ORDER BY is_default DESC, name ASC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Get single provider ───────────────────────────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }
    res.json({ success: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Create provider ───────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      provider_type, name, description = '', base_url = '',
      auth_type = 'bearer', api_key, is_free_tier = false,
      free_quota_tokens = 0, enabled = true, config_json = '{}'
    } = req.body;

    if (!provider_type || !name) {
      return res.status(400).json({ success: false, error: 'provider_type and name are required' });
    }

    const validTypes = ['openai', 'openrouter', 'anthropic', 'azure', 'gemini', 'ollama', 'custom', 'minimax'];
    if (!validTypes.includes(provider_type)) {
      return res.status(400).json({ success: false, error: `Invalid provider_type. Must be one of: ${validTypes.join(', ')}` });
    }

    const id = `prov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

    db.prepare(`INSERT INTO llm_provider_registry
      (id, provider_type, name, description, base_url, auth_type, api_key_encrypted, api_key_last4,
       iv, auth_tag, key_version, is_free_tier, free_quota_tokens, config_json, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, provider_type, name, description, base_url, auth_type,
      encryptedKey, apiKeyLast4, iv, authTag, 1,
      is_free_tier ? 1 : 0, free_quota_tokens, config_json, enabled ? 1 : 0
    );

    res.status(201).json({ success: true, data: { id }, message: 'Provider created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Update provider ───────────────────────────────────────────────────────────
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }

    const {
      name, description, base_url, auth_type, api_key, is_free_tier,
      free_quota_tokens, config_json, enabled
    } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined)              { updates.push('name = ?'); params.push(name); }
    if (description !== undefined)       { updates.push('description = ?'); params.push(description); }
    if (base_url !== undefined)          { updates.push('base_url = ?'); params.push(base_url); }
    if (auth_type !== undefined)         { updates.push('auth_type = ?'); params.push(auth_type); }
    if (is_free_tier !== undefined)     { updates.push('is_free_tier = ?'); params.push(is_free_tier ? 1 : 0); }
    if (free_quota_tokens !== undefined) { updates.push('free_quota_tokens = ?'); params.push(free_quota_tokens); }
    if (config_json !== undefined)       { updates.push('config_json = ?'); params.push(config_json); }
    if (enabled !== undefined)           { updates.push('enabled = ?'); params.push(enabled ? 1 : 0); }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (api_key) {
      const enc = encryptApiKey(api_key);
      updates.push('api_key_encrypted = ?', 'api_key_last4 = ?', 'iv = ?', 'auth_tag = ?', 'key_version = key_version + 1');
      params.push(enc.ciphertext, maskApiKey(api_key).replace('sk-****', ''), enc.iv, enc.authTag);
    }

    params.push(req.params.id);
    db.prepare(`UPDATE llm_provider_registry SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true, message: 'Provider updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Delete provider ───────────────────────────────────────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }

    // Check if any workspace connections reference this provider
    const usedCount = db.prepare(
      'SELECT COUNT(*) as cnt FROM llm_connections WHERE provider_registry_id = ?'
    ).get(req.params.id) as { cnt: number };

    if (usedCount.cnt > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete: ${usedCount.cnt} workspace connection(s) still reference this provider. Remove them first.`
      });
    }

    db.prepare('DELETE FROM llm_provider_registry WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Provider deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Set default provider ──────────────────────────────────────────────────────
router.post('/:id/set-default', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }

    // Clear all defaults for this provider type
    const type = (row as { provider_type: string }).provider_type;
    db.prepare('UPDATE llm_provider_registry SET is_default = 0 WHERE provider_type = ?').run(type);

    // Set this one as default
    db.prepare('UPDATE llm_provider_registry SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.params.id);

    res.json({ success: true, message: 'Default provider updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Test provider connection ──────────────────────────────────────────────────
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id) as {
      id: string; provider_type: string; api_key_encrypted: string; iv: string;
      auth_tag: string; key_version: number; base_url: string; auth_type: string;
    } | undefined;

    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }
    if (!row.api_key_encrypted) {
      return res.json({ success: true, message: 'No API key configured — manual verification needed' });
    }

    const { decryptApiKey: dec } = await import('../../utils/crypto.js');
    const payload = { iv: row.iv, authTag: row.auth_tag, ciphertext: row.api_key_encrypted, keyVersion: row.key_version };
    const apiKey = dec(payload);

    const providerType = row.provider_type;
    const testResult = await runProviderTest(providerType, apiKey, row.base_url);

    res.json({ success: true, data: testResult });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

async function runProviderTest(provider: string, apiKey: string, baseUrl: string): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  if (provider === 'openrouter') {
    Object.assign(headers, { 'HTTP-Referer': 'https://fidscript.com', 'X-Title': 'Fidscript' });
  }

  const url = provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1/models'
    : provider === 'anthropic'
    ? 'https://api.anthropic.com/v1/models'
    : provider === 'minimax'
    ? `${baseUrl}/v1/models`
    : `${baseUrl}/models`;

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      const models = extractModelList(provider, data);
      return { ok: true, models: models.slice(0, 10), total: models.length };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function extractModelList(provider: string, data: Record<string, unknown>): string[] {
  if (provider === 'openrouter' && Array.isArray(data.data)) {
    return (data.data as Array<{ id?: string }>).map(m => m.id ?? '').filter(Boolean);
  }
  if (Array.isArray(data.data)) {
    return (data.data as Array<{ id?: string; object?: string }>).map(m => m.id ?? '').filter(Boolean);
  }
  if (Array.isArray(data.models)) {
    return (data.models as Array<{ id?: string }>).map(m => m.id ?? '').filter(Boolean);
  }
  return [];
}

export default router;
