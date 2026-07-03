/**
 * chatbot/list.ts — list chatbots for the logged-in workspace.
 * Auth: JWT. GET /api/platform/chatbots
 */
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface ChatbotRow {
  id: string;
  name: string;
  enabled: number | boolean;
  instance_name: string | null;
  trigger_count: number;
  contact_count: number;
  priority: number;
  description: string | null;
}

function enabledLabel(v: unknown): string {
  if (v === 1 || v === true) return pc.green('enabled');
  if (v === 0 || v === false) return pc.dim('disabled');
  return pc.dim('unknown');
}

export async function listChatbots(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<ChatbotRow[] | unknown>('/api/platform/chatbots');
    const rows: ChatbotRow[] = Array.isArray(data) ? (data as ChatbotRow[]) : [];

    if (flags.mode === 'json') {
      outputJson({ success: true, data: rows });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: rows });
      return;
    }

    if (rows.length === 0) {
      console.error('No chatbots yet. Create one with:');
      console.error('  fidscript chatbot setup');
      console.error('  fidscript chatbot create <name> --instance <name>');
      return;
    }

    const displayRows = rows.map((r) => ({
      ...r,
      status_label: enabledLabel(r.enabled),
    }));

    renderTable(displayRows as unknown as Record<string, unknown>[], [
      { header: 'ID', key: 'id', width: 24 },
      { header: 'Name', key: 'name' },
      { header: 'Status', key: 'status_label' },
      { header: 'Instance', key: 'instance_name' },
      { header: 'Triggers', key: 'trigger_count' },
      { header: 'Contacts', key: 'contact_count' },
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}