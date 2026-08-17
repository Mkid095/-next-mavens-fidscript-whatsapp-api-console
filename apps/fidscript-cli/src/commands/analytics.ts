/**
 * analytics.ts - GET /api/v1/analytics/overview
 * Show workspace analytics from the command line.
 */
import { ApiClient } from '../lib/api-client.js';
import { flags } from '../lib/api-client.js';
import { outputJson, outputYaml, outputFidscriptError, outputCliError } from '../lib/api-client.js';

export async function analyticsOverview(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'Set FIDSCRIPT_API_KEY env var or pass --api-key');
    process.exit(1);
  }
  try {
    const res = await client.getData<{ success: boolean; data: Record<string, number> }>('/api/v1/analytics/overview');

    if (flags.mode === 'json') { outputJson(res.data); return; }
    if (flags.mode === 'yaml') { outputYaml(res.data ?? {}); return; }

    const data = res.data ?? {};
    const entries = Object.entries(data);
    if (entries.length === 0) { console.log('No analytics data for today.'); return; }
    console.log('Analytics - today');
    for (const [metric, value] of entries.sort()) {
      console.log(`  ${metric.replace(/_/g, ' ')}: ${value.toLocaleString()}`);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
