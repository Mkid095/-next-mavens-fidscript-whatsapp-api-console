/**
 * toolsList.ts — `fidscript chatbot tools <chatbot-id> list`
 *
 * Lists all tools attached to a chatbot.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../../lib/api-client.js';
import { renderTable } from '../../../lib/render.js';

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

export async function listTools(chatbotId: string): Promise<void> {
  const client = new ApiClient();
  const base = `/api/platform/chatbots/${encodeURIComponent(chatbotId)}/tools`;

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
