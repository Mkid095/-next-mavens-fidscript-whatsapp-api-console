/**
 * setup/setupImpl.ts - Interactive chatbot setup wizard (headless + TTY).
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, stderr } from 'node:process';
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../../lib/api-client.js';
import {
  type InstanceRow,
  type WizardDraft,
  type SetupConfig,
  isInteractive,
  prompt,
  promptMultiline,
  choose,
  chooseFromList,
} from '../wizardHelpers.js';
import { applySetupConfig } from '../applySetupConfig.js';

export async function setupChatbot(
  opts: { instance?: string; name?: string; config?: string; publish?: boolean },
): Promise<void> {
  // ── HEADLESS MODE: --config <json-or-@file> ──────────────────────────────
  if (opts.config) {
    const client = new ApiClient();
    if (!client.hasJwt) {
      outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
      process.exit(1);
    }
    let raw = opts.config;
    if (raw.startsWith('@')) {
      const fs = await import('node:fs');
      raw = fs.readFileSync(raw.slice(1), 'utf-8');
    }
    let cfg: SetupConfig;
    try {
      cfg = JSON.parse(raw) as SetupConfig;
    } catch (err) {
      console.error(`${pc.red('error:')} --config is not valid JSON: ${(err as Error).message}`);
      process.exit(1);
    }
    if (!cfg.name || !cfg.instance) {
      console.error(`${pc.red('error:')} --config requires at minimum { "name": "...", "instance": "..." }`);
      process.exit(1);
    }
    if (opts.publish && !cfg.publish) cfg.publish = true;
    try {
      const out = await applySetupConfig(client, cfg);
      const result = { success: true, data: { id: out.id, published: out.publishJobId ?? null } };
      if (flags.mode === 'json') outputJson(result);
      else if (flags.mode === 'yaml') outputYaml(result);
      else console.error(`✓ Chatbot '${cfg.name}' created${result.data.published ? ' and publishing' : ''}: ${result.data.id}`);
      return;
    } catch (err) {
      outputFidscriptError(err);
      process.exit(1);
    }
  }

  // ── INTERACTIVE MODE ─────────────────────────────────────────────────────
  if (!isInteractive()) {
    outputCliError('NON_INTERACTIVE', `chatbot setup requires an interactive TTY or a --config flag. Tip: fidscript chatbot setup --config '{"name":"x","instance":"my-bot"}'`);
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  console.error('');
  console.error(pc.bold('🤖 FIDScript Chatbot Setup Wizard'));
  console.error(pc.dim('  Answer the prompts to create a chatbot end-to-end.'));

  // Step 1: name
  const name = opts.name ?? (await prompt('Chatbot name', 'my-assistant'));

  // Step 2: instance
  let instances: InstanceRow[] = [];
  try {
    const data = await client.jwtGetData<InstanceRow[] | unknown>('/api/instance/client-instances');
    instances = Array.isArray(data) ? (data as InstanceRow[]) : [];
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  let instance: InstanceRow;
  if (opts.instance) {
    instance = instances.find((i) => i.name === opts.instance) as InstanceRow;
    if (!instance) {
      outputCliError('INSTANCE_NOT_FOUND', `Instance '${opts.instance}' not found.`);
      process.exit(1);
    }
  } else if (instances.length === 0) {
    outputCliError('NO_INSTANCES', 'No instances available. Create one first: fidscript instance create my-bot');
    process.exit(1);
  } else {
    instance = await chooseFromList<InstanceRow>(
      'Pick an instance',
      instances,
      (i) => `${i.name} (${i.status})`,
    );
  }

  // Step 3: system prompt
  const systemPrompt = await promptMultiline(
    'System prompt - describe the bot\'s tone, role, and what it should/shouldn\'t do.',
  );
  if (!systemPrompt) {
    console.error(pc.red('error:') + ' system prompt is required.');
    process.exit(1);
  }

  // Step 4: provider
  const provider = await choose('AI provider', ['gemini', 'openai', 'anthropic', 'mistral']);

  // Step 5: trigger type
  const triggerType = await choose(
    'Trigger type',
    ['always', 'keyword', 'regex', 'mention'],
  );
  let triggerValue = '';
  if (triggerType === 'keyword' || triggerType === 'regex') {
    triggerValue = await prompt(
      triggerType === 'keyword'
        ? 'Trigger keyword (e.g. "help", "support")'
        : 'Trigger regex (e.g. "^/(menu|start)$")',
    );
  }

  // Step 6: confidence threshold + fallback
  const confidenceStr = await prompt('Confidence threshold (0-1, below this escalates)', '0.6');
  const confidenceThreshold = Number(confidenceStr);
  const fallbackReply = await prompt('Fallback reply (when bot is unsure)', 'Let me connect you with a human.');

  // Step 7: handoff
  const handoffMode = await choose<'auto' | 'always' | 'manual'>(
    'Handoff mode',
    ['auto', 'always', 'manual'],
  );

  const draft: WizardDraft = {
    name,
    instanceId: instance.id,
    instanceName: instance.name,
    systemPrompt,
    provider,
    triggerType,
    triggerValue,
    confidenceThreshold,
    fallbackReply,
    handoffMode,
  };

  // Step 8: confirm
  console.error('');
  console.error(pc.bold('Review:'));
  console.error(`  ${pc.dim('name:')}      ${name}`);
  console.error(`  ${pc.dim('instance:')}  ${instance.name}`);
  console.error(`  ${pc.dim('provider:')}  ${provider}`);
  console.error(`  ${pc.dim('trigger:')}   ${triggerType}${triggerValue ? ` (${triggerValue})` : ''}`);
  console.error(`  ${pc.dim('threshold:')} ${confidenceThreshold}`);
  console.error(`  ${pc.dim('fallback:')}  ${fallbackReply.slice(0, 60)}${fallbackReply.length > 60 ? '…' : ''}`);
  console.error(`  ${pc.dim('handoff:')}   ${handoffMode}`);
  console.error(`  ${pc.dim('prompt:')}    ${systemPrompt.split('\n')[0]?.slice(0, 60)}${systemPrompt.split('\n').length > 1 ? '…' : ''}`);

  const confirm = await prompt('\nCreate this chatbot? (y/n)', 'y');
  if (!/^y(es)?$/i.test(confirm)) {
    console.error('Cancelled.');
    return;
  }

  // Step 9: create
  let created: { id: string };
  try {
    created = await client.jwtPostData<{ id: string }>('/api/platform/chatbots', {
      instance_id: draft.instanceId,
      name: draft.name,
      description: `Created via CLI wizard on ${new Date().toISOString()}`,
    });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  // Step 10: configure (best-effort)
  try {
    await client.jwtPostData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/ai-config`,
      { provider: draft.provider, system_prompt: draft.systemPrompt },
    );
  } catch (err) {
    console.error(pc.yellow('⚠ Failed to set AI config:') + ' ' + (err instanceof Error ? err.message : String(err)));
  }

  try {
    await client.jwtPostData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/triggers`,
      {
        trigger_type: draft.triggerType,
        trigger_value: draft.triggerValue,
        keyword_mode: 'contains',
        enabled: true,
      },
    );
  } catch (err) {
    console.error(pc.yellow('⚠ Failed to add trigger:') + ' ' + (err instanceof Error ? err.message : String(err)));
  }

  try {
    await client.jwtPostData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(created.id)}/policies`,
      {
        confidence_threshold: draft.confidenceThreshold,
        escalate_on_low_confidence: 1,
        fallback_reply: draft.fallbackReply,
      },
    );
  } catch (err) {
    console.error(pc.yellow('⚠ Failed to set policies:') + ' ' + (err instanceof Error ? err.message : String(err)));
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data: { id: created.id, draft } });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data: { id: created.id, draft } });
    return;
  }

  console.error('');
  console.error(pc.green('✓ Chatbot created: ') + created.id);
  console.error('');
  console.error('Next:');
  console.error(`  fidscript chatbot status ${created.id}    # health check`);
  console.error(`  fidscript chatbot publish ${created.id}   # publish to live (use --watch for live progress)`);
}
