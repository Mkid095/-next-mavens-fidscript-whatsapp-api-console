/**
 * LLM Provider CRUD handlers — list, get, create, update, delete, set-default.
 */
import { Request, Response } from 'express';
import { encryptApiKey } from '../../utils/crypto.js';
import db from '../../database.js';

export function listProviders(_req: Request, res: Response): void {
  try {
    const rows = db.prepare(`
      SELECT id, provider_type, name, description, base_url, auth_type,
             api_key_last4, is_default, is_free_tier, free_quota_tokens,
             is_shared, config_json, enabled, created_at, updated_at
      FROM llm_provider_registry
      ORDER BY is_default DESC, name ASC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function getProvider(req: Request, res: Response): void {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }
    res.json({ success: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function createProvider(req: Request, res: Response): Promise<void> {
  try {
    const { provider_type, name, description = '', base_url = '', api_key, is_shared = false, config_json = '{}' } = req.body;
    if (!provider_type || !name) { res.status(400).json({ success: false, error: 'Provider type and name are required' }); return; }
    if (!api_key || !api_key.trim()) { res.status(400).json({ success: false, error: 'API key is required to register a provider' }); return; }

    const validTypes = ['openai', 'openrouter', 'anthropic', 'azure', 'gemini', 'ollama', 'custom', 'minimax'];
    if (!validTypes.includes(provider_type)) { res.status(400).json({ success: false, error: `Invalid provider type. Must be one of: ${validTypes.join(', ')}` }); return; }

    const authType = provider_type === 'azure' ? 'azure_ad' : 'bearer';
    const id = `prov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const enc = encryptApiKey(api_key);
    const apiKeyLast4 = api_key.length > 4 ? api_key.slice(-4) : api_key;

    db.prepare(`INSERT INTO llm_provider_registry
      (id, provider_type, name, description, base_url, auth_type, api_key_encrypted, api_key_last4,
       iv, auth_tag, key_version, is_free_tier, free_quota_tokens, is_shared, config_json, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, provider_type, name, description, base_url, authType, enc.ciphertext, apiKeyLast4, enc.iv, enc.authTag, 1, 0, 0, is_shared ? 1 : 0, config_json, 1);
    res.status(201).json({ success: true, data: { id }, message: 'Provider created' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function updateProvider(req: Request, res: Response): void {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }

    const { name, description, base_url, api_key, is_shared, config_json, enabled } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (base_url !== undefined) { updates.push('base_url = ?'); params.push(base_url); }
    if (is_shared !== undefined) { updates.push('is_shared = ?'); params.push(is_shared ? 1 : 0); }
    if (config_json !== undefined) { updates.push('config_json = ?'); params.push(config_json); }
    if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled ? 1 : 0); }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (api_key) {
      const enc = encryptApiKey(api_key);
      const last4 = api_key.length > 4 ? api_key.slice(-4) : api_key;
      updates.push('api_key_encrypted = ?', 'api_key_last4 = ?', 'iv = ?', 'auth_tag = ?', 'key_version = key_version + 1');
      params.push(enc.ciphertext, last4, enc.iv, enc.authTag);
    }

    params.push(req.params.id);
    db.prepare(`UPDATE llm_provider_registry SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ success: true, message: 'Provider updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function deleteProvider(req: Request, res: Response): void {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }
    const usedCount = db.prepare('SELECT COUNT(*) as cnt FROM llm_connections WHERE provider_registry_id = ?').get(req.params.id) as { cnt: number };
    if (usedCount.cnt > 0) { res.status(409).json({ success: false, error: `Cannot delete: ${usedCount.cnt} workspace connection(s) still reference this provider. Remove them first.` }); return; }
    db.prepare('DELETE FROM llm_provider_registry WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Provider deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function setDefaultProvider(req: Request, res: Response): void {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }
    const type = (row as { provider_type: string }).provider_type;
    db.prepare('UPDATE llm_provider_registry SET is_default = 0 WHERE provider_type = ?').run(type);
    db.prepare('UPDATE llm_provider_registry SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Default provider updated' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
