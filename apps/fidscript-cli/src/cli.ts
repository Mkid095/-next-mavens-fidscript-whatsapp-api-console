/**
 * cli.ts — Commander root with global flags and command tree
 */
import { Command } from 'commander';
import pc from 'picocolors';
import { DEFAULT_BASE_URL } from './lib/credentials.js';
import { flags } from './lib/api-client.js';

function applyColor(s: string): string {
  return flags.noColor ? s : s;
}

// ── Root command ─────────────────────────────────────────────────────────────

export const cli = new Command();

cli
  .name('fidscript')
  .description(
    applyColor(
      `${pc.bold('FIDScript WhatsApp CLI')} — manage instances, send messages, and more\n` +
      `\n` +
      `  ${pc.dim('Get started:')}\n` +
      `    export FIDSCRIPT_API_KEY=fidscript_live_xxx\n` +
      `    fidscript whoami\n` +
      `\n` +
      `  ${pc.dim('Install:')} ${pc.cyan('curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh')}`
    )
  )
  .version('1.0.0', '-v, --version', 'Show CLI version')
  .helpOption('-h, --help', 'Show this help message')
  .option('--api-key <key>', 'FIDScript API key (or set FIDSCRIPT_API_KEY env var)')
  .option('--base-url <url>', 'FIDScript API base URL', DEFAULT_BASE_URL)
  .option('--json', 'Output results as JSON', () => { flags.mode = 'json'; })
  .option('--yaml', 'Output results as YAML', () => { flags.mode = 'yaml'; })
  .option('--no-color', 'Disable ANSI colors', () => { flags.noColor = true; })
  .option('--quiet', 'Suppress informational stderr output (errors still exit non-zero)', () => { flags.quiet = true; })
  .option('--verbose', 'Echo HTTP requests and responses', () => { process.env.FIDSCRIPT_VERBOSE = '1'; })
  .configureOutput({
    writeErr: (s) => process.stderr.write(s),
  });

// ── Global pre-action hook: check credentials ─────────────────────────────────

cli.hook('preAction', (thisCmd) => {
  const opts = thisCmd.opts();
  if (flags.noColor) {
    process.env.NO_COLOR = '1';
  }

  // If --json/--yaml set, suppress informational stderr output
  if (flags.mode !== 'default') {
    // leave stderr open for error messages
  }
});

// ── Login (magic-code sign-in, stores JWT) ─────────────────────────────────

cli
  .command('login')
  .description('Sign in with a magic code sent to your email (stores a JWT)')
  .option('--email <email>', 'Email address (prompts if not given)')
  .option('--code <digits>', 'Magic code from email (skips TTY prompt when paired with --email)')
  .action(async (opts: { email?: string; code?: string }) => {
    const { login } = await import('./commands/login.js');
    await login(opts);
  });

// ── Setup + init onboarding ─────────────────────────────────────────────────

cli
  .command('setup')
  .description('Onboarding summary: identity, API key, instance list, ready-to-paste commands')
  .option('--reveal', 'Print the full API key (otherwise masked)', false)
  .action(async (opts: { reveal: boolean }) => {
    const { setup } = await import('./commands/setup.js');
    await setup(opts);
  });

cli
  .command('init')
  .description('First-run onboarding: orchestrator for login + setup (headless with --email/--code)')
  .option('--email <email>', 'Email for sign-in')
  .option('--code <digits>', 'Magic code from email')
  .action(async (opts: { email?: string; code?: string }) => {
    const { init } = await import('./commands/init.js');
    await init(opts);
  });

// ── Generic API escape hatch (covers every endpoint not yet wrapped as a
//    first-class command: groups/*, chats/*, profile/*, settings/*, etc.) ───

cli
  .command('api <method> <path>')
  .description('Hit any API endpoint. <path> is full e.g. /api/v1/messages/media/my-bot')
  .option('-d, --data <json-or-@file>', 'Request body (JSON or @file.json)')
  .option('--raw', 'Send body as raw text (no JSON parsing)', false)
  .option('--auth <apikey|jwt>', 'Force auth mode (default: auto-detect from path)')
  .option('--confirm', 'Confirm destructive methods (DELETE/PATCH). Auto-set in --json/--yaml.', false)
  .action(async (method: string, path: string, opts: { data?: string; raw?: boolean; auth?: 'apikey' | 'jwt'; confirm?: boolean }) => {
    const { apiCall } = await import('./commands/api.js');
    await apiCall({ method, path, ...opts });
  });

// ── OpenAPI spec ─────────────────────────────────────────────────────────────

cli
  .command('openapi')
  .description('Fetch the live OpenAPI spec (json or yaml). Pipe to a file for client codegen.')
  .option('--format <json|yaml>', 'Output format (default: json)', 'json')
  .action(async (opts: { format: 'json' | 'yaml' }) => {
    const { openapi } = await import('./commands/openapi.js');
    await openapi(opts);
  });

// ── Logout (clear stored JWT + API key) ────────────────────────────────────

cli
  .command('logout')
  .description('Clear stored credentials (JWT + API key)')
  .action(async () => {
    const { logout } = await import('./commands/logout.js');
    await logout();
  });

// ── Whoami ─────────────────────────────────────────────────────────────────

cli
  .command('whoami', { isDefault: false })
  .description('Show authenticated account info (name, balance, plan, instances)')
  .action(async () => {
    const { whoami } = await import('./commands/whoami.js');
    await whoami();
  });

// ── Tokens ─────────────────────────────────────────────────────────────────

cli
  .command('tokens')
  .description('Show token balance and transaction history')
  .action(async () => {
    const { tokens } = await import('./commands/tokens.js');
    await tokens();
  });

// ── Instance subcommands ───────────────────────────────────────────────────────

const instanceCmd = cli.command('instance').description('Manage WhatsApp instances');

instanceCmd
  .command('list')
  .description('List all instances and their connection status')
  .action(async () => {
    const { listInstances } = await import('./commands/instance/list.js');
    await listInstances();
  });

instanceCmd
  .command('create <name>')
  .description('Create a new WhatsApp instance')
  .option('--number <phone>', 'Phone number to link (E.164 format, e.g. +254700000000)')
  .action(async (name: string, opts: { number?: string }) => {
    const { createInstance } = await import('./commands/instance/create.js');
    await createInstance(name, opts);
  });

instanceCmd
  .command('qr <name>')
  .description('Generate and display QR code for linking an instance')
  .option('--number <phone>', 'Phone number to link (E.164 format)')
  .action(async (name: string, opts: { number?: string }) => {
    const { qrInstance } = await import('./commands/instance/qr.js');
    await qrInstance(name, opts);
  });

instanceCmd
  .command('connect <name>')
  .description('Initiate instance connection (logout old session, generate fresh QR)')
  .option('--number <phone>', 'Phone number to link (E.164 format)')
  .action(async (name: string, opts: { number?: string }) => {
    const { connectInstance } = await import('./commands/instance/connect.js');
    await connectInstance(name, opts);
  });

instanceCmd
  .command('restart <name>')
  .description('Restart an instance (requires --confirm)')
  .option('--confirm', 'Confirm the restart', false)
  .action(async (name: string, opts: { confirm: boolean }) => {
    const { restartInstance } = await import('./commands/instance/restart.js');
    await restartInstance(name, opts);
  });

instanceCmd
  .command('watch <name>')
  .description('Stream live connection state + new messages via SSE')
  .option('--timeout <seconds>', 'Stop after N seconds', parseInt)
  .action(async (name: string, opts: { timeout?: number }) => {
    const { watchInstance } = await import('./commands/instance/watch.js');
    await watchInstance(name, opts);
  });

instanceCmd
  .command('logout <name>')
  .description('Disconnect an instance (logout of WhatsApp)')
  .action(async (name: string) => {
    const { logoutInstance } = await import('./commands/instance/logout.js');
    await logoutInstance(name);
  });

instanceCmd
  .command('delete <name>')
  .description('Permanently delete an instance')
  .option('--confirm', 'Confirm deletion', false)
  .action(async (name: string, opts: { confirm: boolean }) => {
    const { deleteInstance } = await import('./commands/instance/delete.js');
    await deleteInstance(name, opts);
  });

// ── Message subcommands (all 10 send types: text, media, location, contact,
//    reaction, poll, list, audio, sticker, status) ──────────────────────────────

const msgCmd = cli.command('message').description('Send messages');
const sendCmd = cli.command('send').description('Send a message (alias for `message`)');

for (const cmd of [msgCmd, sendCmd]) {
  cmd.description('Send a message (alias for `message`)');
}

// Register the full send tree once on the primary `send` command (also exposed as `message`)
const { registerSendCommands } = await import('./commands/messages/send.js');
registerSendCommands(sendCmd);
// Also expose all 10 subcommands under `fidscript message <type>`
registerSendCommands(msgCmd);

// ── Chatbot subcommands ───────────────────────────────────────────────────────

const chatbotCmd = cli.command('chatbot').description('Manage chatbots');

chatbotCmd
  .command('list')
  .description('List all chatbots for the workspace')
  .action(async () => {
    const { listChatbots } = await import('./commands/chatbot/list.js');
    await listChatbots();
  });

chatbotCmd
  .command('create <name>')
  .description('Create a new chatbot (non-interactive)')
  .option('--instance <name>', 'WhatsApp instance to attach to')
  .option('--description <text>', 'Short description')
  .option('--prompt <text>', 'System prompt')
  .action(async (name: string, opts: { instance?: string; description?: string; prompt?: string }) => {
    const { createChatbot } = await import('./commands/chatbot/create.js');
    await createChatbot(name, opts);
  });

chatbotCmd
  .command('get <id>')
  .description('Get full config of a chatbot')
  .action(async (id: string) => {
    const { getChatbot } = await import('./commands/chatbot/get.js');
    await getChatbot(id);
  });

chatbotCmd
  .command('status <id>')
  .description('Health check for a chatbot (status, providers, counts)')
  .action(async (id: string) => {
    const { statusChatbot } = await import('./commands/chatbot/status.js');
    await statusChatbot(id);
  });

chatbotCmd
  .command('delete <id>')
  .description('Delete a chatbot (requires --confirm)')
  .option('--confirm', 'Confirm deletion', false)
  .action(async (id: string, opts: { confirm: boolean }) => {
    const { deleteChatbot } = await import('./commands/chatbot/delete.js');
    await deleteChatbot(id, opts);
  });

chatbotCmd
  .command('publish <id>')
  .description('Publish a chatbot (run the pipeline)')
  .option('--watch', 'Stream live progress via SSE', false)
  .option('--timeout <seconds>', 'Stop --watch after N seconds (exits 2 if no terminal status)', parseInt)
  .option('--draft <json-or-@file>', 'Draft JSON (or @file.json) to publish; empty uses stored config')
  .action(async (id: string, opts: { watch: boolean; timeout?: number; draft?: string }) => {
    const { publishChatbot } = await import('./commands/chatbot/publish.js');
    await publishChatbot(id, opts);
  });

chatbotCmd
  .command('setup')
  .description('Interactive wizard to create + publish a chatbot end-to-end')
  .option('--name <name>', 'Pre-fill chatbot name')
  .option('--instance <name>', 'Pre-pick an instance')
  .option('--config <json-or-@file>', 'Run headless with a JSON config (skips wizard)')
  .option('--publish', 'After creating, also publish', false)
  .action(async (opts: { name?: string; instance?: string; config?: string; publish?: boolean }) => {
    const { setupChatbot } = await import('./commands/chatbot/setup.js');
    await setupChatbot(opts);
  });

chatbotCmd
  .command('ai-config <id>')
  .description('Customize AI behavior: model, system prompt, hallucination policy, BYO LLM')
  .option('--model <model>', 'Model name (e.g. gpt-4o-mini)')
  .option('--provider <provider>', 'Provider (openai, anthropic, gemini, custom)')
  .option('--system-prompt <text>', 'Custom system instruction')
  .option('--hallucination-policy <mode>', 'strict | balanced | creative | disabled')
  .option('--max-tokens <n>', 'Max tokens per response', parseInt)
  .option('--temperature <0..2>', 'Generation temperature', parseFloat)
  .option('--top-p <0..1>', 'Top-p nucleus sampling', parseFloat)
  .option('--max-history-messages <n>', 'How many past messages to include', parseInt)
  .option('--llm-connection <id>', 'Use a workspace LLM connection (BYO API key)')
  .option('--show-current', 'Print current AI config instead of updating')
  .action(async (id: string, opts: {
    model?: string; provider?: string; systemPrompt?: string; hallucinationPolicy?: string;
    maxTokens?: number; temperature?: number; topP?: number; maxHistoryMessages?: number;
    llmConnection?: string; showCurrent?: boolean;
  }) => {
    const { setAiConfig } = await import('./commands/chatbot/ai-config.js');
    await setAiConfig(id, opts);
  });

// ── LLM subcommands (Bring Your Own API key) ─────────────────────────────────

const llmCmd = cli.command('llm').description('Manage LLM connections (BYO API key)');

llmCmd
  .command('list')
  .description('List all LLM connections in this workspace')
  .action(async () => {
    const { listConnections } = await import('./commands/llm/list.js');
    await listConnections();
  });

llmCmd
  .command('providers')
  .description('List providers available in your workspace registry')
  .action(async () => {
    const { listProviders } = await import('./commands/llm/providers.js');
    await listProviders();
  });

llmCmd
  .command('create <name>')
  .description('Create an LLM connection (BYO API key)')
  .requiredOption('--provider <provider>', 'Provider name (openai, anthropic, gemini, custom, ...)')
  .requiredOption('--model <model>', 'Model name (e.g. gpt-4o-mini)')
  .option('--api-key <key-or-@file>', 'API key (or @file.txt)')
  .option('--endpoint <url>', 'Custom endpoint URL (for self-hosted or proxy)')
  .option('--provider-registry-id <id>', 'Registry entry ID (for admin-managed providers)')
  .option('--default', 'Mark as default for this provider', false)
  .option('--monthly-limit <tokens>', 'Monthly token limit', parseInt)
  .option('--priority <n>', 'Priority for failover chain (higher = preferred)', parseInt)
  .action(async (name: string, opts: {
    provider: string; model: string; apiKey?: string; endpoint?: string;
    providerRegistryId?: string; default?: boolean; monthlyLimit?: number; priority?: number;
  }) => {
    const { createConnection } = await import('./commands/llm/create.js');
    await createConnection(name, opts);
  });

llmCmd
  .command('get <id>')
  .description('Show one LLM connection (with masked key)')
  .action(async (id: string) => {
    const { getConnection } = await import('./commands/llm/get.js');
    await getConnection(id);
  });

llmCmd
  .command('update <id>')
  .description('Update an LLM connection')
  .option('--model <model>', 'New model')
  .option('--endpoint <url>', 'New endpoint URL')
  .option('--api-key <key-or-@file>', 'Replace API key')
  .option('--default', 'Mark as default', false)
  .option('--no-default', 'Unset default')
  .option('--enable', 'Enable this connection', false)
  .option('--disable', 'Disable this connection', false)
  .option('--monthly-limit <tokens>', 'Set monthly token limit', parseInt)
  .option('--priority <n>', 'Set priority for failover', parseInt)
  .action(async (id: string, opts: {
    model?: string; endpoint?: string; apiKey?: string;
    default?: boolean; enable?: boolean; disable?: boolean;
    monthlyLimit?: number; priority?: number;
  }) => {
    const { updateConnection } = await import('./commands/llm/update.js');
    await updateConnection(id, {
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.endpoint ? { endpoint: opts.endpoint } : {}),
      ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
      ...(opts.default !== undefined ? { default: opts.default } : {}),
      ...(opts.enable ? { enabled: true } : {}),
      ...(opts.disable ? { enabled: false } : {}),
      ...(opts.monthlyLimit !== undefined ? { monthlyLimit: opts.monthlyLimit } : {}),
      ...(opts.priority !== undefined ? { priority: opts.priority } : {}),
    });
  });

llmCmd
  .command('delete <id>')
  .description('Delete an LLM connection (requires --confirm)')
  .option('--confirm', 'Confirm deletion', false)
  .action(async (id: string, opts: { confirm: boolean }) => {
    const { deleteConnection } = await import('./commands/llm/delete.js');
    await deleteConnection(id, opts);
  });

llmCmd
  .command('test <id>')
  .description('Send a test prompt to verify the connection works')
  .action(async (id: string) => {
    const { testConnection } = await import('./commands/llm/test.js');
    await testConnection(id);
  });
