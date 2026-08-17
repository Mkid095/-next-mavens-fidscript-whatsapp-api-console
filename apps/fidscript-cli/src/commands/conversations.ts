/**
 * conversations.ts - GET /api/v1/conversations
 * List and inspect conversations from the command line.
 */
import { ApiClient } from '../lib/api-client.js';
import { flags } from '../lib/api-client.js';
import { outputJson, outputYaml, outputFidscriptError, outputCliError } from '../lib/api-client.js';
import { renderTable } from '../lib/render.js';

interface Conversation {
  id: string;
  customer_id: string;
  status: string;
  priority: string;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export async function listConversations(opts: { status?: string; priority?: string; page?: number; limit?: number } = {}): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    const qs = new URLSearchParams();
    if (opts.status) qs.set('status', opts.status);
    if (opts.priority) qs.set('priority', opts.priority);
    if (opts.page) qs.set('page', String(opts.page));
    if (opts.limit) qs.set('limit', String(opts.limit));
    const tail = qs.size ? `?${qs}` : '';
    const res = await client.getData<{ success: boolean; data: Conversation[]; pagination?: { total: number } }>(`/api/v1/conversations${tail}`);

    if (flags.mode === 'json') { outputJson(res.data); return; }
    if (flags.mode === 'yaml') { outputYaml(res.data ?? []); return; }

    const convs = res.data ?? [];
    if (convs.length === 0) { console.log('No conversations found.'); return; }
    const rows = convs.map(c => ({
      id: c.id.slice(0, 8),
      status: c.status,
      priority: c.priority,
      unread: c.unread_count,
      lastMsg: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : '-',
      created: new Date(c.created_at).toLocaleDateString(),
    }));
    renderTable(rows, [
      { key: 'id', header: 'ID' },
      { key: 'status', header: 'Status' },
      { key: 'priority', header: 'Priority' },
      { key: 'unread', header: 'Unread' },
      { key: 'lastMsg', header: 'Last Msg' },
      { key: 'created', header: 'Created' },
    ]);
    if (res.pagination) console.error(`Total: ${res.pagination.total}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
