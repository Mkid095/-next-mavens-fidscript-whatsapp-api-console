/**
 * OpenRouter Adapter — openrouter.ai/api/v1
 *
 * OpenRouter is an OpenAI-compatible gateway that routes to 100+ models
 * including free models. Requires HTTP-Referer and X-Title headers.
 * Model identifiers use full paths e.g. "google/gemini-2.0-flash-free".
 */
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './types.js';
import { decryptApiKey } from '../../../utils/crypto.js';
import type { EncryptedPayload } from '../../../utils/crypto.js';

export class OpenRouterAdapter implements LLMAdapter {
  constructor(
    private apiKeyPayload: EncryptedPayload,
    private model: string,
    private endpoint = 'https://openrouter.ai/api/v1'
  ) {}

  provider = 'openrouter';

  name() { return `OpenRouter/${this.model}`; }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const apiKey = decryptApiKey(this.apiKeyPayload);

    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    for (const msg of options.messages) {
      if (msg.role === 'system') continue;
      messages.push({ role: msg.role === 'model' ? 'assistant' : msg.role, content: msg.content });
    }

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    };

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      }));
    }

    const url = `${this.endpoint.replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fidscript.com',
        'X-Title': 'Fidscript WhatsApp Platform',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter API error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices?: Array<{
        message?: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> };
        finish_reason?: string;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = data.choices?.[0];
    const message = choice?.message;
    const reply = message?.content ?? '';
    const finishReason = choice?.finish_reason ?? '';

    return {
      reply,
      confidence: finishReason === 'stop' ? 0.9 : finishReason === 'length' ? 0.6 : 0.7,
      sources: [],
      tokensUsed: {
        prompt: data.usage?.prompt_tokens ?? 0,
        completion: data.usage?.completion_tokens ?? 0,
        total: data.usage?.total_tokens ?? 0,
      },
      model: this.model,
      raw: data,
      stopReason: finishReason,
    };
  }
}
