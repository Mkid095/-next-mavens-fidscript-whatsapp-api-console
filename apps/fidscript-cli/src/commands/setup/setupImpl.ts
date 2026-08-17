/**
 * setupImpl.ts - `fidscript setup`
 *
 * Onboarding summary for an authenticated user. Prints:
 *   - identity (name, email, plan, balance)
 *   - current instance list
 *   - the API key (masked by default; --reveal shows the full key)
 *   - ready-to-paste environment-setup commands
 *   - quickstart for the most common operations
 *
 * Useful after `fidscript login` and as a quick reference at any time.
 */
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface InstanceRow {
  id?: string;
  name: string;
  status: string;
  phone?: string | null;
}

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

function mask(key: string): string {
  return `${key.slice(0, 12)}…${key.slice(-4)}`;
}

function envVarBlock(apiKey: string): string {
  return `# Copy one of these into your shell (~/.bashrc, ~/.zshrc, .env, etc.)
export FIDSCRIPT_API_KEY=${apiKey}

# Or pass per-invocation:
#   fidscript --api-key ${apiKey} whoami`;
}

function quickstartBlock(): string {
  return `# Verify auth
fidscript whoami

# Manage instances
fidscript instance list
fidscript instance create my-bot
fidscript instance watch my-bot        # live SSE state

# Send a message
fidscript send text my-bot --to +254700000000 --text "Hello from CLI!"

# Build a chatbot
fidscript chatbot setup --instance my-bot
fidscript chatbot list

# BYO LLM
fidscript llm create openai-prod \\
  --provider openai --model gpt-4o-mini \\
  --api-key "$OPENAI_API_KEY" --default

# Hit any API endpoint
fidscript api POST /api/v1/messages/media/my-bot \\
  -d '{"number":"+254700000000","mediaUrl":"https://example.com/img.png"}'`;
}

/** Render the setup output as a tree-style terminal report. */
async function renderHuman(client: ApiClient, whoami: WhoamiResponse, instances: InstanceRow[], opts: { reveal: boolean }): Promise<void> {
  const baseUrl = client.configuredBaseUrl;

  console.error('');
  console.error(pc.bold(pc.yellow('✓ Authenticated - FIDScript CLI Setup')));
  console.error('');
  console.error(pc.dim('  Account'));
  console.error(`    ${pc.bold(whoami.name)} <${whoami.email}>`);
  if (whoami.phone) console.error(`    ${whoami.phone}`);
  console.error(`    Plan:    ${whoami.plan?.name ?? 'Unknown'}`);
  console.error(`    Balance: ${whoami.token_balance} tokens`);
  console.error(`    API url: ${pc.cyan(baseUrl)}`);
  console.error('');

  if (instances.length > 0) {
    console.error(pc.dim(`  Instances (${instances.length})`));
    const display = instances.map((i) => ({ ...i, statusColor: i.status }));
    renderTable(display as unknown as Record<string, unknown>[], [
      { header: 'Name', key: 'name' },
      { header: 'Status', key: 'statusColor' },
      { header: 'Phone', key: 'phone' },
    ]);
    console.error('');
  } else {
    console.error(pc.dim('  No instances yet. Create one:'));
    console.error(pc.cyan('    fidscript instance create my-bot'));
    console.error('');
  }

  console.error(pc.dim('  API Key'));
  console.error(`    ${opts.reveal ? whoami.api_key : mask(whoami.api_key)}${opts.reveal ? '' : pc.dim(' (run with --reveal to show in full)')}`);
  console.error('');

  console.error(pc.dim('  Set it in your shell:'));
  console.error(pc.cyan(`    export FIDSCRIPT_API_KEY=${opts.reveal ? whoami.api_key : '<your-api-key>'}`));
  console.error('');

  console.error(pc.dim('  Quickstart'));
  console.error('');
  console.error(pc.yellow('    fidscript whoami                              ✓ who you are'));
  console.error(pc.yellow('    fidscript instance list                       # all your WhatsApp instances'));
  console.error(pc.yellow('    fidscript instance create <name>              # register a new instance'));
  console.error(pc.yellow('    fidscript instance watch <name>               # live SSE state + new messages'));
  console.error(pc.yellow('    fidscript send text <instance> --to <phone> --text <body>'));
  console.error(pc.yellow('    fidscript chatbot setup --instance <name>    # guided wizard'));
  console.error(pc.yellow('    fidscript llm list                            # BYO LLM connections'));
  console.error(pc.yellow('    fidscript api call --help                     # hit any API endpoint'));
  console.error('');

  console.error(pc.dim('  Install on another machine:'));
  console.error(pc.cyan('    curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh'));
  console.error(pc.dim(`    Then: export FIDSCRIPT_API_KEY=${opts.reveal ? whoami.api_key : '<paste-your-key>'}; fidscript whoami`));
  console.error('');
}

export async function setup(opts: { reveal?: boolean; listOnly?: boolean }): Promise<void> {
  const client = new ApiClient();

  if (!client.hasJwt && !client.hasCredentials) {
    outputCliError('NOT_AUTHENTICATED', 'No credentials found. Run `fidscript login` (or set FIDSCRIPT_API_KEY) first.');
    process.exit(1);
  }

  // 1. Identify the caller
  let whoami: WhoamiResponse;
  try {
    whoami = await client.getData<WhoamiResponse>('/api/v1/whoami');
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  // 2. (optional) fetch instance list - prefer DB-backed JWT endpoint
  let instances: InstanceRow[] = [];
  if (client.hasJwt) {
    try {
      const data = await client.jwtGetData<unknown>('/api/instance/client-instances');
      if (Array.isArray(data)) {
        instances = (data as InstanceRow[]).map((r) => ({
          name: String(r.name ?? ''),
          status: String(r.status ?? 'unknown'),
          phone: (r.phone as string | null | undefined) ?? null,
        }));
      }
    } catch {
      /* fall through - empty instance list is fine */
    }
  }

  // --json / --yaml: structured envelope
  if (flags.mode === 'json') {
    outputJson({
      success: true,
      data: {
        account: {
          id: whoami.id,
          name: whoami.name,
          email: whoami.email,
          plan: whoami.plan,
          token_balance: whoami.token_balance,
        },
        api_key: opts.reveal ? whoami.api_key : mask(whoami.api_key),
        api_url: client.configuredBaseUrl,
        instances,
        quickstart: quickstartBlock(),
        env_setup: envVarBlock(whoami.api_key),
      },
    });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({
      success: true,
      data: {
        account: {
          id: whoami.id,
          name: whoami.name,
          email: whoami.email,
          plan: whoami.plan,
          token_balance: whoami.token_balance,
        },
        api_key: opts.reveal ? whoami.api_key : mask(whoami.api_key),
        api_url: client.configuredBaseUrl,
        instances,
      },
    });
    return;
  }

  await renderHuman(client, whoami, instances, { reveal: Boolean(opts.reveal) });
}
