/**
 * Gemini Adapter — google/generateContent API
 * Supports Gemini 1.5 / 2.0 models via Google AI API.
 */
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './types.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
}

interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for Gemini models
  return Math.ceil(text.length / 4);
}

export class GeminiAdapter implements LLMAdapter {
  constructor(private apiKey: string, private model = 'gemini-2.0-flash') {}

  provider = 'gemini';

  name() { return `Gemini/${this.model}`; }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const url =
      `${GEMINI_API_BASE}/models/${this.model}:generateContent` +
      `?key=${this.apiKey}`;

    const contents: GeminiContent[] = [];
    for (const msg of options.messages) {
      if (msg.role === 'system') continue; // inline in request
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.7,
        topP: 0.9,
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    if (options.tools && options.tools.length > 0) {
      body.tools = {
        functionDeclarations: options.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        })),
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: { parts?: GeminiPart[] };
        finishReason?: string;
        safetyRatings?: unknown[];
      }>;
      promptFeedback?: unknown;
    };

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    let reply = '';
    const sources: string[] = [];
    const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

    for (const part of parts) {
      if (part.text) reply += part.text;
      if (part.functionCall) functionCalls.push(part.functionCall);
    }

    // Count tokens
    const promptTokens = estimateTokens(
      options.messages.map(m => m.content).join(' ')
    );
    const completionTokens = estimateTokens(reply);
    const totalTokens = promptTokens + completionTokens;

    // Estimate confidence from finish reason
    const finishReason = candidate?.finishReason ?? '';
    const confidence =
      finishReason === 'STOP' ? 0.9 :
      finishReason === 'MAX_TOKENS' ? 0.6 :
      0.7;

    return {
      reply,
      confidence,
      sources,
      tokensUsed: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
      model: this.model,
      raw: data,
      stopReason: finishReason,
    };
  }
}
