/**
 * llmCommands.ts — LLM connection management commands
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  const llmCmd = target.command('llm').description('Manage LLM connections (BYO API key)');

  llmCmd.command('list')
    .action(async () => {
      const { listConnections } = await import('./llm/list.js');
      await listConnections();
    });

  llmCmd.command('providers')
    .action(async () => {
      const { listProviders } = await import('./llm/providers.js');
      await listProviders();
    });

  llmCmd.command('create <name>')
    .requiredOption('--provider <provider>', 'Provider name')
    .requiredOption('--model <model>', 'Model name')
    .option('--api-key <key-or-@file>', 'API key')
    .option('--endpoint <url>', 'Custom endpoint URL')
    .option('--provider-registry-id <id>', 'Registry entry ID')
    .option('--default', 'Mark as default', false)
    .option('--monthly-limit <tokens>', 'Monthly token limit', parseInt)
    .option('--priority <n>', 'Priority for failover', parseInt)
    .action(async (name: string, opts: Record<string, unknown>) => {
      const { createConnection } = await import('./llm/create.js');
      await createConnection(name, opts as Parameters<typeof createConnection>[1]);
    });

  llmCmd.command('get <id>')
    .action(async (id: string) => {
      const { getConnection } = await import('./llm/get.js');
      await getConnection(id);
    });

  llmCmd.command('update <id>')
    .option('--model <model>')
    .option('--endpoint <url>')
    .option('--api-key <key-or-@file>')
    .option('--default', 'Mark as default', false)
    .option('--no-default', 'Unset default')
    .option('--enable', 'Enable', false)
    .option('--disable', 'Disable', false)
    .option('--monthly-limit <tokens>', '', parseInt)
    .option('--priority <n>', '', parseInt)
    .action(async (id: string, opts: Record<string, unknown>) => {
      const { updateConnection } = await import('./llm/update.js');
      await updateConnection(id, opts as Parameters<typeof updateConnection>[1]);
    });

  llmCmd.command('delete <id>')
    .option('--confirm', 'Confirm deletion', false)
    .action(async (id: string, opts: { confirm: boolean }) => {
      const { deleteConnection } = await import('./llm/delete.js');
      await deleteConnection(id, opts);
    });

  llmCmd.command('test <id>')
    .action(async (id: string) => {
      const { testConnection } = await import('./llm/test.js');
      await testConnection(id);
    });
}
