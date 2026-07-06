/**
 * providerDefaults.ts — default endpoints and models per LLM provider.
 */

export function defaultEndpointForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai:     'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    azure:      '',
    ollama:     'http://localhost:11434/v1',
    custom:     '',
    gemini:     'https://generativelanguage.googleapis.com',
  };
  return defaults[provider] ?? '';
}

export function defaultModelForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai:     'gpt-4o-mini',
    openrouter: 'google/gemini-2.0-flash-free',
    anthropic:  'claude-3-5-haiku-20241022',
    azure:      'gpt-4o-mini',
    ollama:     'llama3',
    custom:     '',
    gemini:     'gemini-2.0-flash',
  };
  return defaults[provider] ?? 'gpt-4o-mini';
}
