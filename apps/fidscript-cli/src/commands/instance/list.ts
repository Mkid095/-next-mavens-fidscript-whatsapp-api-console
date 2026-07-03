/**
 * instance/list.ts — list all instances for the logged-in client.
 * Auth: JWT (client/me). Source of truth: server DB (instances WHERE client_id).
 *
 * Falls back to the v1 connection-state ping per stored instance if no JWT
 * is present (legacy API-key-only flow).
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderTable, instanceStatusColor } from '../../lib/render.js';

interface InstanceRow {
  id?: string;
  name: string;
  status: string;
  phone?: string | null;
  created_at?: string;
}

export async function listInstances(): Promise<void> {
  const client = new ApiClient();

  if (!client.hasJwt && !client.hasCredentials) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` or pass --api-key.');
    process.exit(1);
  }

  let rows: InstanceRow[] = [];

  if (client.hasJwt) {
    try {
      const data = await client.jwtGetData<unknown>('/api/instance/client-instances');
      const list = Array.isArray(data) ? data : [];
      rows = list.map((r) => {
        const o = r as Record<string, unknown>;
        return {
          id: (o.id as string | undefined),
          name: (o.name as string | undefined) ?? '',
          status: (o.status as string | undefined) ?? 'unknown',
          phone: (o.phone as string | null | undefined) ?? null,
          created_at: (o.created_at as string | undefined),
        };
      });
    } catch (err) {
      outputFidscriptError(err);
      process.exit(1);
    }
  } else {
    outputCliError('NOT_SIGNED_IN', 'JWT not found. For the authoritative instance list, run `fidscript login`. Falling back to v1 connection-state per stored instance (deprecated).');
    process.exit(2);
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data: rows });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data: rows });
    return;
  }

  if (rows.length === 0) {
    console.error('No instances registered for this client.');
    console.error('Create one with:');
    console.error('  fidscript instance create my-bot');
    return;
  }

  renderTable(rows as unknown as Record<string, unknown>[], [
    { header: 'Name', key: 'name' },
    {
      header: 'Status',
      key: 'status',
      color: (v: string) => instanceStatusColor(v)(v),
    },
    { header: 'Phone', key: 'phone' },
  ]);
}