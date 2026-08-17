/**
 * new.ts - `fidscript new`
 *
 * Scaffold a new FIDScript project in a local directory.
 *
 * Usage:
 *   fidscript new my-agent                      # agent template (default)
 *   fidscript new my-agent --template workflow  # event-driven workflow
 *   fidscript new my-shopify --template shopify-order
 *   fidscript new my-agent --yes                # non-interactive
 *
 * Templates:
 *   agent          - WhatsApp AI chatbot (prompt, tools, triggers, examples)
 *   workflow       - Event-driven automation (Shopify/WooCommerce → WhatsApp)
 *   shopify-order  - Shopify order → WhatsApp confirmation flow
 */
import { Command } from 'commander';
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';
import { outputCliError, outputJson } from '../lib/api-client-output.js';
import { flags } from '../lib/api-client.js';

const TEMPLATES = ['agent', 'workflow', 'shopify-order'] as const;
type Template = typeof TEMPLATES[number];

const NL = '\n';

// ─── File content generators ───────────────────────────────────────────────────

function fidscriptConfig(name: string, template: Template): string {
  if (template === 'shopify-order') {
    return [
      "import type { FidscriptConfig } from 'fidscript';",
      NL,
      `const config: FidscriptConfig = {`,
      `  name: '${name}',`,
      `  description: 'Shopify order confirmation bot',`,
      `  workflows: ['./workflows/order-confirm.ts'],`,
      `};`,
      NL,
      `export default config;`,
    ].join(NL);
  }
  if (template === 'workflow') {
    return [
      "import type { FidscriptConfig } from 'fidscript';",
      NL,
      `const config: FidscriptConfig = {`,
      `  name: '${name}',`,
      `  description: 'Event-driven automation',`,
      `  workflows: ['./workflows/'],`,
      `};`,
      NL,
      `export default config;`,
    ].join(NL);
  }
  return [
    "import type { FidscriptConfig } from 'fidscript';",
    NL,
    `const config: FidscriptConfig = {`,
    `  name: '${name}',`,
    `  description: 'WhatsApp AI chatbot',`,
    `  agents: ['./agents/customer-support.ts'],`,
    `  tools: ['./tools/'],`,
    `};`,
    NL,
    `export default config;`,
  ].join(NL);
}

function envExample(): string {
  return [
    '# FIDScript credentials',
    'FIDSCRIPT_API_KEY=fidscript_live_xxxxxxxxxxxx',
    'FIDSCRIPT_BASE_URL=https://whatsapp.fidscript.com',
    NL,
    '# Optional: Shopify store (for shopify-order template)',
    'SHOPIFY_SHOP=mystore.myshopify.com',
    'SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxx',
  ].join(NL);
}

function readmeShopify(name: string): string {
  return [
    `# ${name}`,
    NL,
    `FIDScript project: Shopify order confirmation automation.`,
    NL,
    `## What it does`,
    NL,
    `When a customer places an order in your Shopify store, this bot sends them a`,
    `WhatsApp confirmation with their order details.`,
    NL,
    `## Setup`,
    NL,
    `1. Install dependencies:`,
    `   npm install`,
    NL,
    `2. Configure credentials:`,
    `   cp .env.example .env`,
    `   # Edit .env with your API key and Shopify store details`,
    NL,
    `3. Connect Shopify:`,
    `   - Dashboard: Settings > Integrations > Add Shopify store`,
    `   - Paste your Access Token`,
    NL,
    `4. Register the webhook with Shopify:`,
    `   - Admin: Settings > Notifications > Webhooks`,
    `   - Create webhook for "Order creation" pointing to:`,
    `     https://your-server/api/platform/connectors/shopify/webhook`,
    NL,
    `5. Deploy:`,
    `   fidscript deploy`,
    NL,
    `## Files`,
    NL,
    `  fidscript.config.ts   - Project manifest`,
    `  workflows/order-confirm.ts  - Order -> WhatsApp message flow`,
    `  .env.example`,
    `  README.md`,
  ].join(NL);
}

function readmeWorkflow(name: string): string {
  return [
    `# ${name}`,
    NL,
    `FIDScript project: event-driven automation.`,
    NL,
    `## What it does`,
    NL,
    `Listens for events from your connected integrations (Shopify, WooCommerce, etc.)`,
    `and runs automated workflows in response.`,
    NL,
    `## Setup`,
    NL,
    `  npm install`,
    `  cp .env.example .env`,
    `  fidscript deploy`,
    NL,
    `## Events`,
    NL,
    `  shopify.order.created    - fires when a Shopify order is placed`,
    `  woocommerce.order.created - fires when a WooCommerce order is created`,
    `  message.received        - fires when a customer sends a WhatsApp message`,
    NL,
    `## Workflows`,
    NL,
    `Edit workflows/ to define your automation. Each file exports a workflow object`,
    `with trigger conditions and action steps.`,
  ].join(NL);
}

function readmeAgent(name: string): string {
  return [
    `# ${name}`,
    NL,
    `FIDScript project: WhatsApp AI chatbot.`,
    NL,
    `## What it does`,
    NL,
    `An AI-powered WhatsApp chatbot that answers customer questions, looks up`,
    `orders, and hands off to a human agent when needed.`,
    NL,
    `## Setup`,
    NL,
    `  npm install`,
    `  cp .env.example .env`,
    `  # Edit .env with your API key`,
    `  fidscript deploy`,
    NL,
    `## Agents`,
    NL,
    `Edit agents/customer-support.ts to customize the bot's personality,`,
    `system prompt, and tool set.`,
    NL,
    `## Testing`,
    NL,
    `  fidscript send text --to +254700000000 --body "Hello!"`,
  ].join(NL);
}

function readmeMd(name: string, template: Template): string {
  if (template === 'shopify-order') return readmeShopify(name);
  if (template === 'workflow') return readmeWorkflow(name);
  return readmeAgent(name);
}

function agentCustomerSupport(): string {
  return [
    `/**`,
    ` * agents/customer-support.ts - Default AI agent`,
    ` */`,
    `import type { AgentDefinition } from 'fidscript';`,
    NL,
    `export const agent: AgentDefinition = {`,
    `  name: 'customer-support',`,
    `  description: 'General customer support agent',`,
    `  systemPrompt: \`You are a helpful customer support agent for a Kenyan business.`,
    `Be friendly, concise, and helpful. Use Swahili or English depending on the customer.`,
    `You can look up orders, check product availability, and answer common questions.`,
    `Escalate to a human agent for refunds, complaints, or anything sensitive.\`,`,
    `  tools: ['shopify_get_order', 'woocommerce_get_order'],`,
    `  triggers: ['message.received'],`,
    `  llm: {`,
    `    provider: 'openai',`,
    `    model: 'gpt-4o-mini',`,
    `  },`,
    `};`,
  ].join(NL);
}

function workflowOrderConfirm(): string {
  return [
    `/**`,
    ` * workflows/order-confirm.ts - Shopify order -> WhatsApp confirmation`,
    ` *`,
    ` * Trigger: shopify.order.created`,
    ` * Action:  send WhatsApp message to the customer`,
    ` */`,
    `import type { WorkflowDefinition } from 'fidscript';`,
    NL,
    `export const orderConfirm: WorkflowDefinition = {`,
    `  name: 'order-confirm',`,
    `  description: 'Send a WhatsApp confirmation when an order is placed',`,
    `  trigger: 'shopify.order.created',`,
    `  conditions: [],`,
    `  actions: [`,
    `    {`,
    `      type: 'send_message',`,
    `      body: \`Your order {{orderName}} has been received!`,
    `We will notify you when it ships.\`,`,
    `    },`,
    `  ],`,
    `};`,
  ].join(NL);
}

function workflowExample(): string {
  return [
    `/**`,
    ` * workflows/example.ts - Example workflow`,
    ` *`,
    ` * Trigger: shopify.order.created`,
    ` * Condition: order total > 1000 KES`,
    ` * Actions: send WhatsApp, add tag, assign to team`,
    ` */`,
    `import type { WorkflowDefinition } from 'fidscript';`,
    NL,
    `export const exampleWorkflow: WorkflowDefinition = {`,
    `  name: 'example',`,
    `  description: 'Example event-driven workflow',`,
    `  trigger: 'shopify.order.created',`,
    `  conditions: [`,
    `    { field: 'totalPrice', op: 'greater_than', value: '1000' },`,
    `  ],`,
    `  actions: [`,
    `    {`,
    `      type: 'send_message',`,
    `      body: 'Thank you for your order! A support agent will reach out shortly.',`,
    `    },`,
    `    { type: 'add_tag', tag: 'high-value-customer' },`,
    `    { type: 'assign_team', teamId: 'team_premium' },`,
    `  ],`,
    `};`,
  ].join(NL);
}

function toolsIndex(): string {
  return [
    `/**`,
    ` * tools/index.ts - Custom tools for this agent`,
    ` *`,
    ` * Define tools here that wrap your internal APIs, databases, or third-party services.`,
    ` * Tools are callable by the AI agent at runtime.`,
    ` */`,
    `import type { ToolDefinition } from 'fidscript';`,
    NL,
    `export const tools: ToolDefinition[] = [`,
    `  // Example:`,
    `  // {`,
    `  //   name: 'get_order',`,
    `  //   description: 'Look up an order by ID',`,
    `  //   parameters: { orderId: { type: 'string' } },`,
    `  //   handler: async ({ orderId }) => {`,
    `  //     // Call your ERP / Shopify / WooCommerce API here`,
    `  //     return { orderId, status: 'confirmed' };`,
    `  //   },`,
    `  // },`,
    `];`,
  ].join(NL);
}

function webhooksHandlers(): string {
  return [
    `/**`,
    ` * webhooks/handlers.ts - Custom webhook handlers`,
    ` *`,
    ` * The FIDScript platform already handles Shopify and WooCommerce webhooks`,
    ` * automatically. Implement this for custom third-party integrations.`,
    ` */`,
    `import type { WebhookHandler } from 'fidscript';`,
    NL,
    `export const handlers: Record<string, WebhookHandler> = {`,
    `  // 'custom.event': async ({ payload, context }) => {`,
    `  //   console.log('Got custom event:', payload);`,
    `  // },`,
    `};`,
  ].join(NL);
}

function examplesSendMessage(): string {
  return [
    `/**`,
    ` * examples/send-message.ts - Send a WhatsApp message via the SDK`,
    ` *`,
    ` * Run: npx ts-node examples/send-message.ts`,
    ` */`,
    `import { Fidscript } from 'fidscript';`,
    NL,
    `const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY! });`,
    NL,
    `async function main() {`,
    `  const result = await fs.messages.sendText({`,
    `    number: '+254700000000',`,
    `    text: 'Hello from your FIDScript project!',`,
    `  });`,
    NL,
    `  if (result.success) {`,
    `    console.log('Message sent:', result.data?.messageId);`,
    `  } else {`,
    `    console.error('Failed:', result.error);`,
    `  }`,
    `}`,
    NL,
    `main();`,
  ].join(NL);
}

function examplesCreateCampaign(): string {
  return [
    `/**`,
    ` * examples/create-campaign.ts - Create a broadcast campaign`,
    ` */`,
    `import { Fidscript } from 'fidscript';`,
    NL,
    `const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY! });`,
    NL,
    `async function main() {`,
    `  const campaign = await fs.campaigns.create({`,
    `    name: 'Summer Sale 2025',`,
    `    content: 'Check out our summer collection!',`,
    `    segment: 'all_contacts',`,
    `    instanceName: 'my-bot',`,
    `  });`,
    `  console.log('Campaign created:', campaign);`,
    `}`,
    NL,
    `main();`,
  ].join(NL);
}

function packageJson(name: string, template: Template): string {
  const deps: Record<string, string> = { fidscript: '^0.1.0' };
  const scripts: Record<string, string> = { deploy: 'fidscript deploy', test: 'fidscript workflow test' };
  if (template !== 'agent') deps['@fidscript/types'] = '^0.1.0';

  return JSON.stringify({
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    description: `FIDScript ${template} project`,
    type: 'module',
    scripts,
    dependencies: deps,
    devDependencies: {
      typescript: '^5.0.0',
      'ts-node': '^10.9.0',
      '@types/node': '^20.0.0',
    },
  }, null, 2);
}

function tsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: 'dist',
      rootDir: '.',
    },
    include: ['**/*.ts'],
    exclude: ['node_modules', 'dist'],
  }, null, 2);
}

// ─── Core logic ─────────────────────────────────────────────────────────────

interface ScaffoldOpts {
  projectName: string;
  template: Template;
  outputDir: string;
  yes?: boolean;
}

function writeFile(dir: string, filename: string, content: string): void {
  const filePath = path.join(dir, filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export async function newCommand(opts: ScaffoldOpts): Promise<void> {
  const { projectName, template, outputDir, yes } = opts;
  const targetDir = path.resolve(outputDir);

  // Pre-flight: check for non-empty directory
  if (fs.existsSync(targetDir)) {
    const entries = fs.readdirSync(targetDir);
    if (entries.length > 0 && !yes) {
      outputCliError(
        'DIR_NOT_EMPTY',
        `Target directory "${outputDir}" is not empty. ` +
        `Use --yes to scaffold into a non-empty directory.`
      );
      process.exit(1);
    }
  }

  // Scaffold files
  const files: Array<[string, string]> = [
    ['fidscript.config.ts', fidscriptConfig(projectName, template)],
    ['.env.example', envExample()],
    ['README.md', readmeMd(projectName, template)],
    ['package.json', packageJson(projectName, template)],
    ['tsconfig.json', tsConfig()],
  ];

  if (template === 'agent') {
    files.push(
      ['agents/customer-support.ts', agentCustomerSupport()],
      ['tools/index.ts', toolsIndex()],
      ['examples/send-message.ts', examplesSendMessage()],
      ['examples/create-campaign.ts', examplesCreateCampaign()],
    );
  }

  if (template === 'workflow' || template === 'shopify-order') {
    files.push(
      ['workflows/order-confirm.ts', workflowOrderConfirm()],
      ['workflows/example.ts', workflowExample()],
      ['webhooks/handlers.ts', webhooksHandlers()],
    );
  }

  for (const [filename, content] of files) {
    writeFile(targetDir, filename, content);
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data: { projectName, template, outputDir: targetDir, files: files.map(f => f[0]) } });
    return;
  }

  console.error(pc.green(`✓ Created ${template} project "${projectName}" at ${targetDir}`));
  console.error('');
  console.error('Next steps:');
  console.error(`  cd ${projectName}`);
  console.error('  cp .env.example .env');
  console.error('  # Edit .env with your API key');
  console.error('  npm install');
  if (template === 'agent') {
    console.error('  fidscript chatbot setup   # Interactive wizard');
  } else {
    console.error('  fidscript deploy          # Deploy your automation');
  }
}

// ─── Commander registration ───────────────────────────────────────────────────

export function register(target: Command): void {
  target
    .command('new <project-name>')
    .description('Scaffold a new FIDScript project (agent | workflow | shopify-order template)')
    .option('--template <name>', `Project template: ${TEMPLATES.join(' | ')}`, 'agent')
    .option('-o, --output <path>', 'Output directory (default: ./<project-name>)')
    .option('-y, --yes', 'Non-interactive: accept all defaults', false)
    .option('--workspace <id>', 'Target workspace ID')
    .action(async (projectName: string, opts: {
      template?: string;
      output?: string;
      yes?: boolean;
      workspace?: string;
    }) => {
      const template = (opts.template ?? 'agent') as Template;
      if (!TEMPLATES.includes(template)) {
        outputCliError('INVALID_TEMPLATE', `Template must be one of: ${TEMPLATES.join(', ')}`);
        process.exit(1);
      }
      await newCommand({
        projectName,
        template,
        outputDir: opts.output ?? projectName,
        yes: opts.yes,
      });
    });
}
