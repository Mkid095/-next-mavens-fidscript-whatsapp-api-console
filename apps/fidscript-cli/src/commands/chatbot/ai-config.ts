/**
 * chatbot/ai-config.ts — fully customize a chatbot's AI behavior.
 * Auth: JWT. PUT /api/platform/chatbots/:id/ai-config
 *
 * Lets you wire in your own LLM (via --llm-connection) and tune generation:
 *   - hallucination_policy: 'strict' (refuse on low confidence), 'balanced' (default),
 *     'creative' (allow), 'disabled' (pass-through)
 *   - max_tokens / temperature / top_p / max_history_messages
 *   - system_prompt (the custom instruction the user supplies)
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';

const HALLUCINATION_POLICIES = ['strict', 'balanced', 'creative', 'disabled'] as const;
type HallucinationPolicy = (typeof HALLUCINATION_POLICIES)[number];

export async function setAiConfig(
  id: string,
  opts: {
    model?: string;
    provider?: string;
    systemPrompt?: string;
    hallucinationPolicy?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    maxHistoryMessages?: number;
    llmConnection?: string;
    /** When true, prints current config instead of updating. */
    showCurrent?: boolean;
  },
): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  if (opts.showCurrent) {
    // Show what we have now by calling GET /:id (the full config includes aiConfig)
    try {
      const full = await client.jwtGetData<{
        aiConfig?: Array<Record<string, unknown>>;
      }>(`/api/platform/chatbots/${encodeURIComponent(id)}`);
      const aiConfig = (full.aiConfig ?? [])[0] ?? {};
      if (flags.mode === 'json') {
        outputJson({ success: true, data: { chatbot_id: id, ai_config: aiConfig } });
      } else if (flags.mode === 'yaml') {
        outputYaml({ success: true, data: { chatbot_id: id, ai_config: aiConfig } });
      } else {
        console.error(`AI config for ${id}:`);
        for (const [k, v] of Object.entries(aiConfig)) {
          console.error(`  ${k}: ${v === null || v === undefined ? '(not set)' : String(v)}`);
        }
      }
      return;
    } catch (err) {
      outputFidscriptError(err);
      process.exit(1);
    }
  }

  // Validate hallucination policy if provided
  if (opts.hallucinationPolicy && !HALLUCINATION_POLICIES.includes(opts.hallucinationPolicy as HallucinationPolicy)) {
    outputFidscriptError(new Error(
      `Invalid --hallucination-policy '${opts.hallucinationPolicy}'. Must be one of: ${HALLUCINATION_POLICIES.join(', ')}`,
    ));
    process.exit(1);
  }

  const body: Record<string, unknown> = {
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.provider ? { provider: opts.provider } : {}),
    ...(opts.systemPrompt ? { system_prompt: opts.systemPrompt } : {}),
    ...(opts.hallucinationPolicy ? { hallucination_policy: opts.hallucinationPolicy } : {}),
    ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    ...(opts.topP !== undefined ? { top_p: opts.topP } : {}),
    ...(opts.maxHistoryMessages !== undefined ? { max_history_messages: opts.maxHistoryMessages } : {}),
    ...(opts.llmConnection ? { llm_connection_id: opts.llmConnection } : {}),
  };

  if (Object.keys(body).length === 0) {
    outputFidscriptError(new Error(
      'No options supplied. Pass at least one of: --model, --provider, --system-prompt, --hallucination-policy, --max-tokens, --temperature, --top-p, --max-history-messages, --llm-connection. Use --show-current to inspect.',
    ));
    process.exit(1);
  }

  try {
    await client.jwtPut<{ success: boolean; message?: string }>(
      `/api/platform/chatbots/${encodeURIComponent(id)}/ai-config`,
      body,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { chatbot_id: id, updated: Object.keys(body) } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { chatbot_id: id, updated: Object.keys(body) } });
      return;
    }

    console.error(`✓ AI config updated for ${id}.`);
    console.error(`  Updated fields: ${Object.keys(body).join(', ')}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}