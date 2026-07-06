/**
 * loginImpl.ts — magic-code sign-in / sign-up
 *
 * Flow:
 *   1. POST /api/auth/request-code  { email }
 *   2. Get the 6-digit code from email
 *   3. POST /api/auth/verify-code   { email, code }
 *   4. Persist { apiKey, jwt } to ~/.fidscript/credentials
 *
 * Headless mode:
 *   - When --email AND --code are both provided as flags, NO TTY is required.
 *     This lets AI agents / cron jobs complete sign-in without a human.
 *   - The two steps can be run separately:
 *       $ fidscript login --email you@example.com          → "ok" + the email was sent
 *       (user reads code from inbox, agent gets it from elsewhere)
 *       $ fidscript login --email you@example.com --code 123456
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import pc from 'picocolors';
import {
  ApiClient,
  outputFidscriptError,
  outputJson,
  outputYaml,
  outputMsg,
  flags,
} from '../../lib/api-client.js';

interface VerifyCodeData {
  token: string;
  role: 'client' | 'admin';
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    token_balance: number;
    plan_id: string | null;
    api_key: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

function isInteractive(): boolean {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

async function prompt(question: string): Promise<string> {
  if (!isInteractive()) {
    failJson(
      'NON_INTERACTIVE',
      'login requires a TTY for interactive prompts. Pass --email and --code as flags for headless use.',
    );
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

function failJson(code: string, message: string): never {
  if (flags.mode === 'json' || flags.mode === 'yaml') {
    const envelope = { success: false, error: { code, message } };
    if (flags.mode === 'json') outputJson(envelope);
    else outputYaml(envelope);
  } else {
    console.error(`${pc.red('error:')} ${message} ${pc.dim(`[${code}]`)}`);
  }
  process.exit(1);
}

async function requestCode(client: ApiClient, email: string): Promise<void> {
  try {
    await client.post<unknown>('/api/auth/request-code', { email });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
  if (flags.mode !== 'json' && flags.mode !== 'yaml') {
    outputMsg(`Code sent. Check your inbox at ${email}.`);
  }
}

async function verifyAndStore(
  client: ApiClient,
  email: string,
  code: string,
): Promise<NonNullable<VerifyCodeData['client']>> {
  let data: VerifyCodeData;
  try {
    const res = await client.post<VerifyCodeData>('/api/auth/verify-code', { email, code });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Verification failed');
    }
    data = res.data;
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (data.role !== 'client') {
    failJson('NOT_CLIENT', 'Admin accounts cannot use the CLI. Sign in as a client.');
  }
  if (!data.client) {
    failJson('NO_CLIENT', 'Server did not return client profile.');
  }

  client.setApiKey(data.client.api_key);
  client.setJwt(data.token);
  return data.client;
}

export async function login(opts: { email?: string; code?: string }): Promise<void> {
  const client = new ApiClient();

  // Resolve email
  const email = opts.email?.trim().toLowerCase() || await prompt(`${pc.cyan('Email:')} `).then((s) => s.trim().toLowerCase());
  if (!email) failJson('MISSING_EMAIL', 'Email is required.');

  // HEADLESS: both --email and --code supplied → just verify, skip TTY entirely.
  if (opts.code) {
    if (!/^\d{4,8}$/.test(opts.code)) {
      failJson('INVALID_CODE', 'Code must be 4-8 digits.');
    }
    const profile = await verifyAndStore(client, email, opts.code);
    if (flags.mode === 'json') {
      outputJson({ success: true, data: { client: profile } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { client: profile } });
      return;
    }
    outputMsg(`Logged in as ${pc.bold(profile.name)} <${profile.email}>.`);
    return;
  }

  // INTERACTIVE (or partial-headless): request a code, then either prompt
  // (TTY) or wait for the user to retry with --code (non-TTY).
  await requestCode(client, email);

  if (!isInteractive()) {
    failJson(
      'CODE_REQUIRED',
      'Code sent. Re-run this command with the --code flag once you have it: ' +
        `fidscript login --email ${email} --code <code>`,
    );
  }

  const code = await prompt(`${pc.cyan('Enter the 6-digit code:')} `);
  if (!/^\d{4,8}$/.test(code)) {
    failJson('INVALID_CODE', 'Code must be 4-8 digits.');
  }

  const profile = await verifyAndStore(client, email, code);
  if (flags.mode === 'json') {
    outputJson({ success: true, data: { client: profile } });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data: { client: profile } });
    return;
  }

  outputMsg(`Logged in as ${pc.bold(profile.name)} <${profile.email}>`);
  console.error(`  ${pc.dim('API key:')} ${profile.api_key.slice(0, 16)}…`);
  console.error(`  ${pc.dim('Plan:')} ${profile.plan_id ?? 'Free'}`);
  console.error(`  ${pc.dim('Token balance:')} ${profile.token_balance}`);
  console.error('');
  console.error(pc.dim('Next steps:'));
  console.error(`  fidscript instance list`);
  console.error(`  fidscript instance create my-bot`);
  console.error(`  fidscript instance qr my-bot`);
}
