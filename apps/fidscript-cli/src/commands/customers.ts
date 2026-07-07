/**
 * customers.ts — GET /api/v1/customers, /api/v1/customers/:id
 * List and inspect customers from the command line.
 */
import { ApiClient } from '../lib/api-client.js';
import { flags } from '../lib/api-client.js';
import { outputJson, outputYaml, outputFidscriptError, outputCliError } from '../lib/api-client.js';
import { renderTable } from '../lib/render.js';

interface Customer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_identifier: string | null;
  channel: string | null;
  created_at: string;
  last_seen_at: string | null;
}

export async function listCustomers(opts: { page?: number; limit?: number } = {}): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    const qs = new URLSearchParams();
    if (opts.page) qs.set('page', String(opts.page));
    if (opts.limit) qs.set('limit', String(opts.limit));
    const tail = qs.size ? `?${qs}` : '';
    const res = await client.getData<{ success: boolean; data: Customer[]; pagination?: { total: number } }>(`/api/v1/customers${tail}`);

    if (flags.mode === 'json') { outputJson(res.data); return; }
    if (flags.mode === 'yaml') { outputYaml(res.data ?? []); return; }

    const customers = res.data ?? [];
    if (customers.length === 0) { console.log('No customers found.'); return; }
    const rows = customers.map(c => ({
      id: c.id.slice(0, 8),
      name: c.display_name ?? c.primary_identifier ?? '—',
      channel: c.channel ?? '—',
      created: new Date(c.created_at).toLocaleDateString(),
      lastSeen: c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString() : '—',
    }));
    renderTable(rows, [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'channel', header: 'Channel' },
      { key: 'created', header: 'Created' },
      { key: 'lastSeen', header: 'Last Seen' },
    ]);
    if (res.pagination) console.error(`Total: ${res.pagination.total}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}

export async function getCustomer(id: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    const res = await client.getData<{ success: boolean; data: Customer }>(`/api/v1/customers/${id}`);
    if (flags.mode === 'json') { outputJson(res.data); return; }
    if (flags.mode === 'yaml') { outputYaml(res.data); return; }

    const c = res.data;
    console.log(`Customer ${c.id}`);
    console.log(`  Name: ${c.display_name ?? '—'}`);
    console.log(`  Channel: ${c.channel ?? '—'}`);
    console.log(`  Primary ID: ${c.primary_identifier ?? '—'}`);
    console.log(`  Created: ${new Date(c.created_at).toLocaleString()}`);
    console.log(`  Last Seen: ${c.last_seen_at ? new Date(c.last_seen_at).toLocaleString() : '—'}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
