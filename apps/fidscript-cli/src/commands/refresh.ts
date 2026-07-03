/**
 * refresh.ts — `fidscript refresh`
 *
 * Re-runs the magic-code login flow with the stored email to issue a new JWT.
 * Use this when:
 *   - your JWT has expired (24h TTL) and you get a 401
 *   - you want to rotate credentials without a full re-login
 *   - CI/agent loops that need daily credential refresh
 *
 * Flags:
 *   --email <addr>   Override the stored email
 *   --code <digits>  Submit the code without an interactive prompt (headless)
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../lib/api-client.js';

function isInteractive(): boolean {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export async function refresh(opts: { email?: string; code?: string }): Promise<void> {
  const client = new ApiClient();

  if (!client.hasCredentials) {
    outputCliError(
      'NOT_AUTHENTICATED',
      'No API key stored. Run `fidscript login --email you@example.com` first.',
    );
    process.exit(1);
  }

  const email = (opts.email || client.getEmail() || '').trim();
  if (!email) {
    outputCliError(
      'MISSING_EMAIL',
      'No stored email. Run `fidscript login --email you@example.com` (or pass --email here).',
    );
    process.exit(1);
  }

  // Step 1: request a new code
  try {
    await client.post<{ message: string }>('/api/auth/request-code', { email });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  // Headless: if --json/--yaml is set, emit structured code-required error.
  // Otherwise, emit human message and exit 1. process.exit terminates before
  // the function can continue, so the "json" branch can never reach the second
  // if-block — which is why TS narrows flags.mode to 'default' below.
  if (flags.mode === 'json' || flags.mode === 'yaml') {
    outputJson({
      success: false,
      error: { code: 'CODE_REQUIRED', message: `Code sent. Re-run with --code: fidscript refresh --email ${email} --code <digits>` },
    });
    setImmediate(() => process.exit(1));
    return;
  }

  if (!isInteractive()) {
    outputCliError(
      'CODE_REQUIRED',
      `Code sent. Re-run with --code: fidscript refresh --email ${email} --code <digits>`,
    );
    process.exit(1);
  }
  void isInteractive; // keep export alive in unused-import scenarios

  const code = opts.code || (await prompt(pc.cyan('Enter the 6-digit code: ')));
  if (!/^\d{4,8}$/.test(code)) {
    outputCliError('INVALID_CODE', 'Code must be 4-8 digits.');
    process.exit(1);
  }

  // Step 2: verify
  let data: { token: string; role: string; client?: { api_key: string } };
  try {
    const res = await client.post<typeof data>('/api/auth/verify-code', { email, code });
    if (!res.success || !res.data) throw new Error(res.error || 'Verification failed');
    data = res.data;
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (data.role !== 'client' || !data.client) {
    outputCliError('NOT_CLIENT', 'Admin accounts cannot use the CLI.');
    process.exit(1);
    return; // unreachable, but helps TS narrow flags.mode below
  }

  client.setApiKey(data.client.api_key);
  client.setJwt(data.token);
  client.setEmail(email);

  // Capture the mode into a typed const so subsequent comparisons narrow cleanly
  const outputMode: 'default' | 'json' | 'yaml' = flags.mode;
  // After all the process.exit(1) branches above, outputMode is always 'default'
  // here. The remaining branches (json/yaml) are reachable only if those
  // process.exits never fire. We use a direct compare to make TS happy.
  if ((outputMode as 'json') === 'json') {
    outputJson({
      success: true,
      data: { api_key_prefix: data.client.api_key.slice(0, 12) + '…', email },
    });
    return;
  }
  if ((outputMode as 'yaml') === 'yaml') {
    outputYaml({ success: true, data: { api_key_prefix: data.client.api_key.slice(0, 12) + '…', email } });
    return;
  }

  console.error(pc.green(`✓ Credentials refreshed for ${email}.`));
  console.error(`  New JWT stored in ~/.fidscript/credentials.`);
}