/**
 * webhooks.ts — GET|POST|DELETE /api/v1/webhooks
 * Manage webhooks from the command line.
 */
import { ApiClient } from '../lib/api-client.js';
import { flags } from '../lib/api-client.js';
import { outputJson, outputYaml, outputFidscriptError, outputCliError } from '../lib/api-client.js';
import { renderTable } from '../lib/render.js';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  created_at: string;
}

export async function listWebhooks(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    const res = await client.getData<{ success: boolean; data: Webhook[] }>('/api/v1/webhooks');

    if (flags.mode === 'json') { outputJson(res.data); return; }
    if (flags.mode === 'yaml') { outputYaml(res.data ?? []); return; }

    const whs = res.data ?? [];
    if (whs.length === 0) { console.log('No webhooks configured.'); return; }
    const rows = whs.map(w => ({
      id: w.id.slice(0, 8),
      url: w.url.length > 50 ? w.url.slice(0, 50) + '…' : w.url,
      events: w.events.join(', '),
      status: w.status,
      created: new Date(w.created_at).toLocaleDateString(),
    }));
    renderTable(rows, [
      { key: 'id', header: 'ID' },
      { key: 'url', header: 'URL' },
      { key: 'events', header: 'Events' },
      { key: 'status', header: 'Status' },
      { key: 'created', header: 'Created' },
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}

export async function createWebhook(url: string, events: string[]): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    const res = await client.post<Webhook & { secret: string }>('/api/v1/webhooks', { url, events });

    if (flags.mode === 'json') { outputJson(res.data); return; }
    if (flags.mode === 'yaml') { outputYaml(res.data); return; }

    const wh = res.data!;
    console.log(`Webhook created: ${wh.id}`);
    console.log(`  URL: ${wh.url}`);
    console.log(`  Secret: ${wh.secret}`);
    console.log('  Store this secret — it will not be shown again.');
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}

export async function deleteWebhook(id: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    await client.delete<{ success: boolean }>(`/api/v1/webhooks/${id}`);
    console.log(`Webhook ${id} deleted.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
