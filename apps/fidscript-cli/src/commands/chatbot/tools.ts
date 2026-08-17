/**
 * chatbot/tools.ts - list / attach / detach tools on a chatbot.
 * Auth: JWT.
 *   - list:   GET    /api/platform/chatbots/:id/tools
 *   - attach: POST   /api/platform/chatbots/:id/tools        { tool_ids: [...] }
 *   - detach: DELETE /api/platform/chatbots/:id/tools/:toolId
 *
 * Examples:
 *   fidscript chatbot tools bot_123
 *   fidscript chatbot tools bot_123 attach tool_456
 *   fidscript chatbot tools bot_123 detach tool_456
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface AttachedToolRow {
  id: string;
  name: string;
  description: string | null;
  implementation: string | null;
  parameters_json: string;
  tool_enabled: number | boolean;
  attached_enabled: number | boolean;
  data_source_id: string;
  data_source_name: string;
}

function boolLabel(v: unknown): string {
  if (v === 1 || v === true) return 'on';
  if (v === 0 || v === false) return 'off';
  return '?';
}

/** Subcommand dispatcher. */
export async function chatbotTools(
  chatbotId: string,
  action: string | undefined,
  opts: { toolId?: string },
): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  const base = `/api/platform/chatbots/${encodeURIComponent(chatbotId)}/tools`;

  // No action (or 'list') → list attached tools
  if (!action || action === 'list') {
    await listAttached(client, base);
    return;
  }

  if (action === 'attach') {
    if (!opts.toolId) {
      outputCliError('TOOL_ID_REQUIRED', 'Usage: fidscript chatbot tools <chatbot-id> attach <tool-id>');
      process.exit(1);
    }
    await attachTool(client, base, chatbotId, opts.toolId);
    return;
  }

  if (action === 'detach') {
    if (!opts.toolId) {
      outputCliError('TOOL_ID_REQUIRED', 'Usage: fidscript chatbot tools <chatbot-id> detach <tool-id>');
      process.exit(1);
    }
    await detachTool(client, base, chatbotId, opts.toolId);
    return;
  }

  outputCliError('UNKNOWN_ACTION', `Unknown action '${action}'. Use: list | attach <tool-id> | detach <tool-id>`);
  process.exit(1);
}

async function listAttached(client: ApiClient, base: string): Promise<void> {
  try {
    const data = await client.jwtGetData<AttachedToolRow[] | unknown>(base);
    const rows: AttachedToolRow[] = Array.isArray(data) ? (data as AttachedToolRow[]) : [];

    if (flags.mode === 'json') {
      outputJson({ success: true, data: rows });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: rows });
      return;
    }

    if (rows.length === 0) {
      console.error('No tools attached to this chatbot.');
      console.error('Attach one with: fidscript chatbot tools <chatbot-id> attach <tool-id>');
      return;
    }

    const displayRows = rows.map((r) => ({
      ...r,
      tool_on: boolLabel(r.tool_enabled),
      attached_on: boolLabel(r.attached_enabled),
    }));

    renderTable(displayRows as unknown as Record<string, unknown>[], [
      { header: 'Tool ID', key: 'id', width: 26 },
      { header: 'Name', key: 'name' },
      { header: 'Source', key: 'data_source_name' },
      { header: 'Tool', key: 'tool_on' },
      { header: 'Attached', key: 'attached_on' },
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}

async function attachTool(
  client: ApiClient,
  base: string,
  chatbotId: string,
  toolId: string,
): Promise<void> {
  try {
    const res = await client.jwtPostData<{ message?: string }>(base, { tool_ids: [toolId] });

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { chatbot_id: chatbotId, tool_id: toolId, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { chatbot_id: chatbotId, tool_id: toolId, ...res } });
      return;
    }
    console.error(`✓ Tool ${toolId} attached to chatbot ${chatbotId}.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}

async function detachTool(
  client: ApiClient,
  base: string,
  chatbotId: string,
  toolId: string,
): Promise<void> {
  try {
    const res = await client.jwtDelete<{ message?: string }>(
      `${base}/${encodeURIComponent(toolId)}`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { chatbot_id: chatbotId, tool_id: toolId, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { chatbot_id: chatbotId, tool_id: toolId, ...res } });
      return;
    }
    console.error(`✓ Tool ${toolId} detached from chatbot ${chatbotId}.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
