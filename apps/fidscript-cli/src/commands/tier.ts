/**
 * tier.ts — `fidscript tier` (alias: `fidscript quota`)
 *
 * Shows the user's WhatsApp rate-limit tier, current daily/monthly usage,
 * token balance, and quality-rating state. Combines:
 *   - GET /api/v1/whoami   (plan + api_key)
 *   - GET /api/v1/usage    (request + send + token counts)
 *
 * WhatsApp tier limits (per Meta quality rating):
 *   Tier 0: 250    unique customers / 24h
 *   Tier 1: 1,000  unique customers / 24h
 *   Tier 2: 10,000 unique customers / 24h
 *   Tier 3: 100,000 unique customers / 24h
 *   Tier 4: Unlimited
 *
 * Speed ceiling: ~80 MPS server-side; we pace to 10–30 MPS depending on queue depth.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../lib/api-client.js';
import pc from 'picocolors';

interface WhoamiResponse {
  id: string;
  name: string;
  email: string;
  token_balance: number;
  plan: { id: string; name: string } | null;
}

interface UsageResponse {
  requestsToday: number;
  requestsMonth: number;
  sendsMonth: number;
  tokenSpendMonth: number;
  failedRequestsMonth: number;
}

const TIER_LIMITS: Array<{ tier: number; limit: string; description: string }> = [
  { tier: 0, limit: '250',    description: 'New accounts + accounts with quality issues' },
  { tier: 1, limit: '1,000',  description: 'Sustained positive quality' },
  { tier: 2, limit: '10,000', description: 'Strong quality over rolling 7 days' },
  { tier: 3, limit: '100,000', description: 'Consistent high quality at scale' },
  { tier: 4, limit: 'Unlimited', description: 'Reserved for very large senders' },
];

const SPEED_LIMITS = [
  'WhatsApp ceiling: ~80 MPS (messages per second)',
  'Portal API: 10 reads/sec/client, 2 mutations/sec/client',
  'Bulk campaigns: 10 MPS at idle, 30 MPS when queue ≥ 5,000',
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function tier(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Set FIDSCRIPT_API_KEY or run `fidscript login`.');
    process.exit(1);
  }

  let who: WhoamiResponse;
  let use: UsageResponse;
  try {
    [who, use] = await Promise.all([
      client.getData<WhoamiResponse>('/api/v1/whoami'),
      client.getData<UsageResponse>('/api/v1/usage'),
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (flags.mode === 'json') {
    outputJson({
      success: true,
      data: {
        workspace: { id: who.id, name: who.name, email: who.email },
        plan: who.plan,
        tier_limits: TIER_LIMITS,
        speed_limits: SPEED_LIMITS,
        usage: use,
        token_balance: who.token_balance,
      },
    });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({
      success: true,
      data: {
        workspace: { id: who.id, name: who.name, email: who.email },
        plan: who.plan,
        tier_limits: TIER_LIMITS,
        speed_limits: SPEED_LIMITS,
        usage: use,
        token_balance: who.token_balance,
      },
    });
    return;
  }

  // Human format
  const planName = who.plan?.name ?? 'Free';
  console.error('');
  console.error(pc.bold(pc.yellow('📊 FIDScript Tier & Quota')));
  console.error('');
  console.error(pc.dim('  Workspace'));
  console.error(`    ${pc.bold(who.name)} <${who.email}>`);
  console.error(`    Plan:   ${pc.cyan(planName)}`);
  console.error('');
  console.error(pc.dim('  Token balance'));
  console.error(`    ${pc.bold(String(who.token_balance))} tokens remaining`);
  console.error('');
  console.error(pc.dim('  This month (rolling 30d)'));
  console.error(`    Requests:    ${pc.bold(fmt(use.requestsMonth))}`);
  console.error(`    Failed:      ${fmt(use.failedRequestsMonth)}`);
  console.error(`    Sends:       ${pc.bold(fmt(use.sendsMonth))}`);
  console.error(`    Tokens spent: ${pc.bold(fmt(use.tokenSpendMonth))}`);
  console.error('');
  console.error(pc.dim('  Today'));
  console.error(`    Requests:    ${pc.bold(fmt(use.requestsToday))}`);
  console.error('');
  console.error(pc.dim('  WhatsApp Meta Tier (24h unique-customer caps)'));
  TIER_LIMITS.forEach(({ tier, limit, description }) => {
    console.error(`    Tier ${tier}: ${pc.cyan(limit).padEnd(11)} ${pc.dim(description)}`);
  });
  console.error('');
  console.error(pc.dim('  Speed (server-enforced)'));
  SPEED_LIMITS.forEach((s) => console.error(`    ${pc.dim('•')} ${s}`));
  console.error('');
  console.error(pc.dim('  Bump up your tier'));
  console.error('    High send volume + low block rate → Meta promotes you to Tier 1/2/3.');
  console.error('    See: https://whatsapp.fidscript.com/docs#meta-policy');
  console.error('');
}