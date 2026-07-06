/**
 * LLM Provider test + model management handlers.
 */
import { Request, Response } from 'express';
import { decryptApiKey } from '../../utils/crypto.js';
import db from '../../database.js';
import { runProviderTest, detectContextLength } from './llmTestUtils.js';

export async function testProvider(req: Request, res: Response): Promise<void> {
  try {
    const row = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(req.params.id) as {
      id: string; provider_type: string; api_key_encrypted: string; iv: string;
      auth_tag: string; key_version: number; base_url: string; auth_type: string;
    } | undefined;

    if (!row) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }
    if (!row.api_key_encrypted) { res.json({ success: true, data: { ok: false, error: 'No API key configured' } }); return; }

    const apiKey = decryptApiKey({ iv: row.iv, authTag: row.auth_tag, ciphertext: row.api_key_encrypted, keyVersion: row.key_version });
    const testResult = await runProviderTest(row.provider_type, apiKey, row.base_url);

    if (testResult.ok && Array.isArray(testResult.models) && testResult.models.length > 0) {
      let imported = 0;
      for (const modelId of testResult.models as string[]) {
        const modelName = modelId.replace(/[-_/]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const modelDbId = `pm_${row.id}_${modelId}`;
        const ctx = detectContextLength(modelId, row.provider_type);
        try {
          db.prepare(`
            INSERT OR IGNORE INTO llm_provider_models
              (id, provider_registry_id, model_id, model_name, context_length,
               supports_tools, supports_json_mode, latency_class,
               cost_per_1k_input_tokens, cost_per_1k_output_tokens, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(modelDbId, row.id, modelId, modelName, ctx, 0, 0, 'medium', 0, 0);
          imported++;
        } catch (_) { /* model may already exist */ }
      }
      (testResult as Record<string, unknown>).imported = imported;
    }

    res.json({ success: true, data: testResult });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function listModels(req: Request, res: Response): void {
  try {
    const rows = db.prepare(`
      SELECT id, model_id, model_name, context_length, supports_tools,
             supports_json_mode, latency_class, cost_per_1k_input_tokens,
             cost_per_1k_output_tokens, enabled, created_at
      FROM llm_provider_models
      WHERE provider_registry_id = ?
      ORDER BY model_name ASC
    `).all(req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function addModel(req: Request, res: Response): void {
  try {
    const provider = db.prepare('SELECT id FROM llm_provider_registry WHERE id = ?').get(req.params.id);
    if (!provider) { res.status(404).json({ success: false, error: 'Provider not found' }); return; }

    const { model_id, model_name, context_length = 4096, supports_tools = false, supports_json_mode = false,
      latency_class = 'medium', cost_per_1k_input_tokens = 0, cost_per_1k_output_tokens = 0, enabled = true } = req.body;

    if (!model_id || !model_name) { res.status(400).json({ success: false, error: 'model_id and model_name are required' }); return; }
    if (!['fast', 'medium', 'slow'].includes(latency_class)) { res.status(400).json({ success: false, error: 'latency_class must be fast, medium, or slow' }); return; }

    const id = `pm_${req.params.id}_${model_id}`;
    db.prepare(`
      INSERT OR REPLACE INTO llm_provider_models
        (id, provider_registry_id, model_id, model_name, context_length,
         supports_tools, supports_json_mode, latency_class,
         cost_per_1k_input_tokens, cost_per_1k_output_tokens, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, model_id, model_name, context_length, supports_tools ? 1 : 0, supports_json_mode ? 1 : 0, latency_class, cost_per_1k_input_tokens, cost_per_1k_output_tokens, enabled ? 1 : 0);
    res.status(201).json({ success: true, data: { id }, message: 'Model added' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function removeModel(req: Request, res: Response): void {
  try {
    const result = db.prepare('DELETE FROM llm_provider_models WHERE provider_registry_id = ? AND id = ?').run(req.params.id, req.params.modelId);
    if (result.changes === 0) { res.status(404).json({ success: false, error: 'Model not found' }); return; }
    res.json({ success: true, message: 'Model removed' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

