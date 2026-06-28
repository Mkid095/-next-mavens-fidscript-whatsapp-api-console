/**
 * Public v1 Provider Catalog — /api/v1/providers
 *
 * Public-facing provider information (no credentials required).
 * Documents available provider types and their capabilities.
 */
import { Router, Request, Response } from 'express';
import db from '../../database.js';

const router = Router();

// ─── List available provider types ─────────────────────────────────────────────
// GET /api/v1/providers
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, provider_type, name, description, is_free_tier, is_default
      FROM llm_provider_registry
      WHERE enabled = 1
      ORDER BY is_default DESC, is_free_tier DESC, name ASC
    `).all();

    const providers = (rows as Array<{
      id: string;
      provider_type: string;
      name: string;
      description: string;
      is_free_tier: number;
      is_default: number;
    }>).map(r => ({
      id: r.id,
      type: r.provider_type,
      name: r.name,
      description: r.description,
      is_free_tier: Boolean(r.is_free_tier),
      is_default: Boolean(r.is_default),
    }));

    res.json({
      success: true,
      data: {
        providers,
        billing: {
          ai_reply: 10,
          dataset_search: 2,
          tool_call: 2,
          memory_save: 1,
          knowledge_search: 1,
        },
        plans: {
          starter: { name: 'Starter', ai_units: 5000 },
          growth: { name: 'Growth', ai_units: 50000 },
          business: { name: 'Business', ai_units: 250000 },
          enterprise: { name: 'Enterprise', ai_units: 'custom' },
        },
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Get models for a provider type ───────────────────────────────────────────
// GET /api/v1/providers/:type/models
router.get('/:type/models', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    // Look up the registry to find default endpoint
    const reg = db.prepare(
      'SELECT base_url, api_key_encrypted, iv, auth_tag, key_version FROM llm_provider_registry WHERE provider_type = ? AND enabled = 1 ORDER BY is_default DESC LIMIT 1'
    ).get(type) as {
      base_url: string;
      api_key_encrypted: string;
      iv: string;
      auth_tag: string;
      key_version: number;
    } | undefined;

    if (!reg) {
      return res.status(404).json({ success: false, error: `Provider type "${type}" not found` });
    }

    // Known model lists for popular providers (free models marked)
    const knownModels: Record<string, Array<{ id: string; name: string; free: boolean }>> = {
      openrouter: [
        { id: 'google/gemini-2.0-flash-free', name: 'Gemini 2.0 Flash (Free)', free: true },
        { id: 'google/gemini-1.5-flash-free', name: 'Gemini 1.5 Flash (Free)', free: true },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', free: false },
        { id: 'openai/gpt-4o', name: 'GPT-4o', free: false },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', free: true },
        { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B Instruct', free: true },
        { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct', free: true },
        { id: 'qwen/qwen-2-7b-instruct', name: 'Qwen 2 7B Instruct', free: true },
      ],
      openai: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', free: false },
        { id: 'gpt-4o', name: 'GPT-4o', free: false },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', free: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', free: false },
      ],
      anthropic: [
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', free: false },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', free: false },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', free: false },
      ],
      gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', free: false },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', free: false },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', free: false },
      ],
    };

    const models = knownModels[type] ?? [];

    res.json({
      success: true,
      data: {
        provider_type: type,
        models,
        note: 'Free models require no API key credits. Paid models use workspace billing.',
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
