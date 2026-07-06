/**
 * dataSourceCommands.ts — Data source management commands
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  const dsCmd = target.command('data-source').alias('datasource').description('Manage data sources');

  dsCmd.command('list')
    .action(async () => {
      const { listDataSources } = await import('./data-source/list.js');
      await listDataSources();
    });

  dsCmd.command('create <name>')
    .requiredOption('--type <type>', 'Data source type')
    .option('--config <json>', 'Configuration JSON')
    .action(async (name: string, opts: Record<string, unknown>) => {
      const { createDataSource } = await import('./data-source/create.js');
      await createDataSource(name, opts as Parameters<typeof createDataSource>[1]);
    });

  dsCmd.command('delete <id>')
    .option('--confirm', 'Confirm deletion', false)
    .action(async (id: string, opts: { confirm: boolean }) => {
      const { deleteDataSource } = await import('./data-source/delete.js');
      await deleteDataSource(id, opts);
    });
}
