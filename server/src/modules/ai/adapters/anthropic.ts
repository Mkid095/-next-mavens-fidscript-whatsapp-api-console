/**
 * Anthropic Adapter — api.anthropic.com/v1/messages
 *
 * Uses the Anthropic Messages API (not chat completions).
 * Different from OpenAI: max_tokens is a top-level parameter,
 * system prompt is a separate top-level parameter, and the
 * response structure is different.
 */
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './types.js';
import { decryptApiKey } from '../../../utils/crypto.js';
import type { EncryptedPayload } from '../../../utils/crypto.js';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicAdapter implements LLMAdapter {
  constructor(
    private apiKeyPayload: EncryptedPayload,
    private model: string
  ) {}

  provider = 'anthropic';

  name() { return `Anthropic/${this.model}`; }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const apiKey = decryptApiKey(this.apiKeyPayload);

    // Build messages array — anthropic does NOT support system messages in messages array
    const messages: Array<{ role: string; content: string }> = [];
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

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));
    }

    const url = `${ANTHROPIC_API_BASE}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const reply = data.content?.[0]?.type === 'text'
      ? (data.content[0].text ?? '')
      : '';

    const stopReason = data.stop_reason ?? '';
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;

    return {
      reply,
      confidence: stopReason === 'end_turn' ? 0.9 : stopReason === 'max_tokens' ? 0.6 : 0.7,
      sources: [],
      tokensUsed: {
        prompt: inputTokens,
        completion: outputTokens,
        total: inputTokens + outputTokens,
      },
      model: this.model,
      raw: data,
      stopReason,
    };
  }
}
