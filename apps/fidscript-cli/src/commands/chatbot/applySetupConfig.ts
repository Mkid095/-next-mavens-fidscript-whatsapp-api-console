/**
 * applySetupConfig.ts - Apply a SetupConfig to the API (headless path).
 */
import type { ApiClient } from '../../lib/api-client.js';
import type { InstanceRow } from './wizardHelpers.js';
import type { SetupConfig } from './wizardHelpers.js';

export async function applySetupConfig(
  client: ApiClient,
  cfg: SetupConfig,
): Promise<{ id: string; publishJobId?: string }> {
  const list = await client.jwtGetData<InstanceRow[] | unknown>('/api/instance/client-instances');
  const instances: InstanceRow[] = Array.isArray(list) ? (list as InstanceRow[]) : [];
  const instance = instances.find((i) => i.name === cfg.instance);
  if (!instance) {
    throw new Error(`Instance '${cfg.instance}' not found. Available: ${instances.map((i) => i.name).join(', ') || '(none)'}`);
  }

  const created = await client.jwtPostData<{ id: string }>('/api/platform/chatbots', {
    instance_id: instance.id,
    name: cfg.name,
    description: `Created via CLI (headless) on ${new Date().toISOString()}`,
  });

  const prompt = cfg.system_prompt ?? cfg.prompt;
  const aiConfigBody: Record<string, unknown> = {
    ...(cfg.provider ? { provider: cfg.provider } : {}),
    ...(cfg.model ? { model: cfg.model } : {}),
    ...(prompt ? { system_prompt: prompt } : {}),
    ...(cfg.hallucination_policy ? { hallucination_policy: cfg.hallucination_policy } : {}),
    ...(cfg.max_tokens !== undefined ? { max_tokens: cfg.max_tokens } : {}),
    ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
    ...(cfg.top_p !== undefined ? { top_p: cfg.top_p } : {}),
    ...(cfg.max_history_messages !== undefined ? { max_history_messages: cfg.max_history_messages } : {}),
    ...(cfg.llm_connection ? { llm_connection_id: cfg.llm_connection } : {}),
  };
  if (Object.keys(aiConfigBody).length > 0) {
    await client.jwtPut<unknown>(`/api/platform/chatbots/${encodeURIComponent(created.id)}/ai-config`, aiConfigBody);
  }

  if (cfg.trigger) {
    await client.jwtPostData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/triggers`,
      { trigger_type: cfg.trigger.type, trigger_value: cfg.trigger.value ?? '', keyword_mode: 'contains', enabled: true },
    );
  }

  if (cfg.policies && (cfg.policies.confidence_threshold !== undefined || cfg.policies.fallback_reply)) {
    await client.jwtPostData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/policies`,
      {
        ...(cfg.policies.confidence_threshold !== undefined ? { confidence_threshold: cfg.policies.confidence_threshold } : {}),
        ...(cfg.policies.fallback_reply ? { fallback_reply: cfg.policies.fallback_reply } : {}),
        escalate_on_low_confidence: 1,
      },
    );
  }

  if (cfg.handoff) {
    await client.jwtPostData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/handoff-rules`,
      { conditions_json: '[]', target_team_name: cfg.handoff === 'always' ? 'Default' : '', priority: 0, enabled: true },
    );
  }

  let publishJobId: string | undefined;
  if (cfg.publish) {
    const pub = await client.jwtPostData<{ jobId: string }>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/publish`, {},
    );
    publishJobId = pub.jobId;
  }

  return { id: created.id, publishJobId };
}
