/**
 * chatbot/create.ts — create a chatbot by name + instance.
 * Auth: JWT. POST /api/platform/chatbots
 *
 * Returns the new chatbot ID. Use `fidscript chatbot setup` for a guided wizard.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

interface CreateResp {
  id: string;
  message: string;
}

interface InstanceRow {
  id: string;
  name: string;
  status: string;
}

export async function createChatbot(
  name: string,
  opts: { instance?: string; description?: string; prompt?: string },
): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  let instanceId: string | undefined;
  let instanceName: string | undefined = opts.instance;

  if (opts.instance) {
    // Look up the instance by name to get its id
    const list = await client.jwtGetData<InstanceRow[] | unknown>('/api/instance/client-instances');
    const instances: InstanceRow[] = Array.isArray(list) ? (list as InstanceRow[]) : [];
    const found = instances.find((i) => i.name === opts.instance);
    if (!found) {
      outputCliError('INSTANCE_NOT_FOUND', `Instance '${opts.instance}' not found. Available instances: ${instances.map((i) => i.name).join(', ') || '(none)'}`);
      process.exit(1);
    }
    instanceId = found.id;
  }

  // Create the chatbot
  let created: CreateResp;
  try {
    created = await client.jwtPostData<CreateResp>('/api/platform/chatbots', {
      instance_id: instanceId,
      name,
      description: opts.description ?? '',
    });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  // If a system prompt was provided, attach it via ai-config
  if (opts.prompt) {
    try {
      await client.jwtPostData<unknown>(
        `/api/platform/chatbots/${encodeURIComponent(created.id)}/ai-config`,
        { system_prompt: opts.prompt },
      );
    } catch (err) {
      outputFidscriptError(err);
      process.exit(1);
    }
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data: created, instance: instanceName });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data: created, instance: instanceName });
    return;
  }

  console.error(`✓ Chatbot '${name}' created.`);
  console.error(`  ID: ${created.id}`);
  if (instanceName) console.error(`  Instance: ${instanceName}`);
  console.error('');
  console.error('Next steps:');
  console.error(`  fidscript chatbot setup                 # guided wizard`);
  console.error(`  fidscript chatbot status ${created.id}`);
  console.error(`  fidscript chatbot publish ${created.id}`);
}