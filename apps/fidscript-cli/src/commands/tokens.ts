/**
 * tokens.ts - GET /api/v1/usage (API key auth)
 * Shows token balance and usage stats.
 */
import { ApiClient } from '../lib/api-client.js';
import { flags } from '../lib/api-client.js';
import { outputJson, outputYaml, outputFidscriptError, outputCliError } from '../lib/api-client.js';
import { renderTokenBalance } from '../lib/render.js';

export async function tokens(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }
  try {
    const data = await client.getData<{
      sends_today: number;
      sends_month: number;
      token_balance: number;
      requests_today: number;
    }>('/api/v1/usage');

    if (flags.mode === 'json') { outputJson(data); return; }
    if (flags.mode === 'yaml') { outputYaml(data); return; }

    renderTokenBalance(data.token_balance);
    console.error(`  Sends today: ${data.sends_today}`);
    console.error(`  Sends this month: ${data.sends_month}`);
    console.error(`  API requests today: ${data.requests_today}`);
    console.error(`  Get more tokens at: ${client.configuredBaseUrl}/client/tokens`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
