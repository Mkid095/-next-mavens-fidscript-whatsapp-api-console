/**
 * LLM provider test utilities — HTTP calls, model extraction, context length.
 */

/** Call provider API and return test result */
export async function runProviderTest(provider: string, apiKey: string, baseUrl: string): Promise<{
  ok: boolean; models?: string[]; total?: number; imported?: number; error?: string;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  if (provider === 'openrouter') Object.assign(headers, { 'HTTP-Referer': 'https://fidscript.com', 'X-Title': 'Fidscript' });

  const url = provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1/models'
    : provider === 'anthropic'
    ? 'https://api.anthropic.com/v1/models'
    : provider === 'minimax'
    ? `${baseUrl}/v1/models`
    : `${baseUrl}/models`;

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      const models = extractModelList(provider, data);
      return { ok: true, models, total: models.length };
    }
    return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function extractModelList(provider: string, data: Record<string, unknown>): string[] {
  if (provider === 'openrouter' && Array.isArray(data.data)) return (data.data as Array<{ id?: string }>).map(m => m.id ?? '').filter(Boolean);
  if (Array.isArray(data.data)) return (data.data as Array<{ id?: string }>).map(m => m.id ?? '').filter(Boolean);
  if (Array.isArray(data.models)) return (data.models as Array<{ id?: string }>).map(m => m.id ?? '').filter(Boolean);
  return [];
}

export function detectContextLength(modelId: string, providerType: string): number {
  const id = modelId.toLowerCase();
  const megaMatch = id.match(/(\d+(?:\.\d+)?)m\b/);
  if (megaMatch) return Math.round(parseFloat(megaMatch[1]) * 1_000_000);
  const kMatch = id.match(/(\d+)k\b/);
  if (kMatch) return parseInt(kMatch[1]) * 1000;

  const providerDefaults: Record<string, Record<string, number>> = {
    openai: { 'gpt-4o': 128000, 'gpt-4o-mini': 128000, 'gpt-4-turbo': 128000, 'gpt-4': 8192, 'gpt-3.5': 16385, 'o1': 128000, 'o1-mini': 128000, 'o3': 200000, 'o3-mini': 200000 },
    anthropic: { 'claude-3-5': 200000, 'claude-3-opus': 200000, 'claude-3-sonnet': 200000, 'claude-3-haiku': 200000, 'claude-2': 100000 },
    gemini: { 'gemini-1.5': 1048576, 'gemini-2': 1048576, 'gemini-1.0': 32768 },
    minimax: { 'minimax-m2': 200000, 'minimax-m3': 200000 },
    openrouter: { 'gemini': 1048576, 'claude': 200000, 'gpt-4': 128000, 'llama-3.1': 131072 },
    ollama: { 'llama3': 8192, 'mistral': 32768, 'phi3': 128000, 'qwen': 32768 },
  };

  const familyDefaults = providerDefaults[providerType];
  if (familyDefaults) {
    const keys = Object.keys(familyDefaults).sort((a, b) => b.length - a.length);
    for (const key of keys) { if (id.includes(key)) return familyDefaults[key]; }
  }
  return 8192;
}
