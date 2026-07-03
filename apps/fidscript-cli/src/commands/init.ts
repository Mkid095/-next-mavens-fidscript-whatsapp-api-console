/**
 * init.ts — `fidscript init`
 *
 * First-run onboarding orchestrator. Wires:
 *   1. login (sign in via magic code)
 *   2. setup (display identity + copy-able API key + quickstart)
 *
 * Fully headless when --email and --code are both supplied. Idempotent —
 * if already authenticated, it skips login and just runs setup.
 */
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputFidscriptError,
  outputCliError,
} from '../lib/api-client.js';

export async function init(opts: { email?: string; code?: string }): Promise<void> {
  const client = new ApiClient();

  // Already authenticated? Skip login, just print setup.
  if (client.hasJwt || client.hasCredentials) {
    if (flags.mode === 'json') {
      outputJson({
        success: true,
        data: {
          already_authenticated: true,
          message: 'Credentials already present. Run `fidscript setup` for the onboarding summary.',
        },
      });
    } else {
      console.error(pc.dim('You are already signed in.'));
      console.error('Run `fidscript setup` for the full onboarding summary.');
    }
    return;
  }

  if (!opts.email) {
    outputCliError(
      'MISSING_EMAIL',
      'init requires --email <address> (headless) or an interactive TTY.',
    );
    process.exit(1);
  }

  // Step 1: request a code (always)
  try {
    await client.post<unknown>('/api/auth/request-code', { email: opts.email });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  // Step 2: verify
  if (!opts.code) {
    outputCliError(
      'CODE_REQUIRED',
      'Code sent. Re-run with --code <digits> once you have it: ' +
        `fidscript init --email ${opts.email} --code <code>`,
    );
    process.exit(1);
  }
  const code = opts.code;

  if (!/^\d{4,8}$/.test(code)) {
    outputCliError('INVALID_CODE', 'Code must be 4-8 digits.');
    process.exit(1);
  }

  let data: { token: string; role: string; client?: { api_key: string } };
  try {
    const res = await client.post<typeof data>('/api/auth/verify-code', { email: opts.email, code });
    if (!res.success || !res.data) throw new Error(res.error || 'Verification failed');
    data = res.data;
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (data.role !== 'client' || !data.client) {
    outputCliError('NOT_CLIENT', 'Admin accounts cannot use the CLI.');
    process.exit(1);
  }

  client.setApiKey(data.client.api_key);
  client.setJwt(data.token);

  if (flags.mode === 'json') {
    outputJson({
      success: true,
      data: {
        already_authenticated: false,
        api_key_prefix: data.client.api_key.slice(0, 12) + '…',
        api_url: client.configuredBaseUrl,
        next: [
          'fidscript setup',
          'fidscript instance list',
          'fidscript instance create <name>',
        ],
      },
    });
    return;
  }

  console.error(pc.green(`✓ Signed in as ${opts.email}.`));
  console.error('');
  console.error('Next:');
  console.error(`  fidscript setup                       # show API key + quickstart`);
  console.error(`  fidscript instance list`);
  console.error(`  fidscript instance create <name>`);
  console.error('');
  console.error('Or call directly:');
  console.error(`  export FIDSCRIPT_API_KEY=${data.client.api_key}`);
  console.error(`  fidscript whoami`);
}