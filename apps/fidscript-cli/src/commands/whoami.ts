/**
 * whoami.ts - GET /api/v1/whoami
 * Shows authenticated account: name, email, token balance, plan, instance count.
 */
import { ApiClient } from '../lib/api-client.js';
import { flags } from '../lib/api-client.js';
import { outputJson, outputYaml, outputFidscriptError, outputCliError } from '../lib/api-client.js';
import { renderTable } from '../lib/render.js';

interface WhoamiResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  token_balance: number;
  plan: { id: string; name: string } | null;
  api_key: string;
  instance_count?: number;
}

export async function whoami(): Promise<void> {
  const client = new ApiClient();

  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', `No API key found. Set FIDSCRIPT_API_KEY env var, or pass --api-key <key>. Get your key at ${client.configuredBaseUrl}/client/api-keys`);
    process.exit(1);
  }

  try {
    const data = await client.getData<WhoamiResponse>('/api/v1/whoami');

    if (flags.mode === 'json') { outputJson(data); return; }
    if (flags.mode === 'yaml') { outputYaml(data); return; }

    console.error(`  ${data.name} <${data.email}>`);
    if (data.phone) console.error(`  ${data.phone}`);
    console.error(`  Plan: ${data.plan?.name ?? 'Unknown'}`);
    console.error(`  Balance: ${data.token_balance} tokens`);
    console.error(`  API Key: ${data.api_key.slice(0, 12)}...`);
    if (data.instance_count !== undefined) console.error(`  Instances: ${data.instance_count}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
