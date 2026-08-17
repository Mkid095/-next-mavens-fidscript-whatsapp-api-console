/**
 * chatbotCommands.ts - Chatbot management commands
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  const chatbotCmd = target.command('chatbot').description('Manage chatbots');

  chatbotCmd.command('list')
    .description('List all chatbots')
    .action(async () => {
      const { listChatbots } = await import('./chatbot/list.js');
      await listChatbots();
    });

  chatbotCmd.command('create <name>')
    .description('Create a new chatbot')
    .option('--instance <name>', 'WhatsApp instance to attach to')
    .option('--description <text>', 'Short description')
    .option('--prompt <text>', 'System prompt')
    .action(async (name: string, opts: { instance?: string; description?: string; prompt?: string }) => {
      const { createChatbot } = await import('./chatbot/create.js');
      await createChatbot(name, opts);
    });

  chatbotCmd.command('get <id>')
    .description('Get full config of a chatbot')
    .action(async (id: string) => {
      const { getChatbot } = await import('./chatbot/get.js');
      await getChatbot(id);
    });

  chatbotCmd.command('status <id>')
    .description('Health check for a chatbot')
    .action(async (id: string) => {
      const { statusChatbot } = await import('./chatbot/status.js');
      await statusChatbot(id);
    });

  chatbotCmd.command('delete <id>')
    .description('Delete a chatbot')
    .option('--confirm', 'Confirm deletion', false)
    .action(async (id: string, opts: { confirm: boolean }) => {
      const { deleteChatbot } = await import('./chatbot/delete.js');
      await deleteChatbot(id, opts);
    });

  chatbotCmd.command('publish <id>')
    .description('Publish a chatbot')
    .option('--watch', 'Stream live progress via SSE', false)
    .option('--timeout <seconds>', 'Stop --watch after N seconds', parseInt)
    .option('--draft <json-or-@file>', 'Draft JSON to publish')
    .action(async (id: string, opts: { watch?: boolean; timeout?: number; draft?: string }) => {
      const { publishChatbot } = await import('./chatbot/publish.js');
      await publishChatbot(id, opts);
    });

  chatbotCmd.command('setup')
    .description('Interactive wizard to create + publish a chatbot end-to-end')
    .option('--name <name>', 'Pre-fill chatbot name')
    .option('--instance <name>', 'Pre-pick an instance')
    .option('--config <json-or-@file>', 'Run headless with a JSON config')
    .option('--publish', 'After creating, also publish', false)
    .action(async (opts: { name?: string; instance?: string; config?: string; publish?: boolean }) => {
      const { setupChatbot } = await import('./chatbot/setup.js');
      await setupChatbot(opts);
    });

  chatbotCmd.command('ai-config <id>')
    .description('Customize AI behavior')
    .option('--model <model>', 'Model name')
    .option('--provider <provider>', 'Provider')
    .option('--system-prompt <text>', 'Custom system instruction')
    .option('--hallucination-policy <mode>', 'strict | balanced | creative')
    .option('--max-tokens <n>', 'Max tokens per response', parseInt)
    .option('--temperature <0..2>', 'Temperature', parseFloat)
    .option('--top-p <0..1>', 'Top-p', parseFloat)
    .option('--max-history-messages <n>', 'Past messages to include', parseInt)
    .option('--llm-connection <id>', 'Use a workspace LLM connection')
    .option('--show-current', 'Print current AI config')
    .action(async (id: string, opts: Record<string, unknown>) => {
      const { setAiConfig } = await import('./chatbot/ai-config.js');
      await setAiConfig(id, opts as Parameters<typeof setAiConfig>[1]);
    });

  chatbotCmd.command('tools <chatbot-id>')
    .description('List, attach, or detach tools')
    .argument('[action]', 'list | attach | detach')
    .argument('[tool-id]', 'Tool ID')
    .action(async (chatbotId: string, action: string | undefined, toolId: string | undefined) => {
      const { chatbotTools } = await import('./chatbot/tools/tools.js');
      await chatbotTools(chatbotId, action, { toolId });
    });
}
