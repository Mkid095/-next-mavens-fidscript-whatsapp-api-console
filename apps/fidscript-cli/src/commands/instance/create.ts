/**
 * instance/create.ts — register a new WhatsApp instance for the logged-in client.
 * Auth: JWT. Source of truth: server DB.
 *
 * Calls POST /api/instance/client-create which:
 *   1. Calls Evolution API /instance/create on the gateway
 *   2. Persists the instance row in our DB with webhook URL
 *   3. Returns the instance record (including its id and evolution_name)
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

interface CreateInstanceData {
  id: string;
  name: string;
  display_name?: string;
  status: string;
  evolution_name: string;
}

export async function createInstance(name: string, opts: { number?: string }): Promise<void> {
  const client = new ApiClient();

  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  const sanitized = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  if (sanitized !== name) {
    outputCliError('NAME_SANITIZED', `Sanitized name to '${sanitized}'.`);
  }

  let data: CreateInstanceData;
  try {
    data = await client.jwtPostData<CreateInstanceData>('/api/instance/client-create', {
      name: sanitized,
      display_name: sanitized,
    });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data, next_step: `fidscript instance qr ${sanitized}` });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data, next_step: `fidscript instance qr ${sanitized}` });
    return;
  }

  console.error(`✓ Instance '${sanitized}' created (status: ${data.status}).`);
  console.error('');
  console.error('Next steps:');
  console.error(`  fidscript instance qr ${sanitized}    # generate QR code to scan`);
  console.error(`  fidscript instance watch ${sanitized}  # live state changes via SSE`);
}