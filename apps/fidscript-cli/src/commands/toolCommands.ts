/**
 * toolCommands.ts — Tool management commands
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  const toolCmd = target.command('tool').description('Manage tools');

  toolCmd.command('list')
    .description('List all tools')
    .option('--data-source <id>', 'Limit to a specific data source')
    .action(async (opts: { dataSource?: string }) => {
      const { listTools } = await import('./tool/list.js');
      await listTools(opts);
    });

  toolCmd.command('generate <name>')
    .description('Generate a new tool from a spec')
    .option('--spec <json-or-@file>', 'Tool specification')
    .action(async (name: string, opts: { spec?: string }) => {
      const { generateTools } = await import('./tool/generate.js');
      // generateTools expects { dataSource?, fromOpenapi?, fromSchema? }
      await generateTools({ dataSource: name, fromOpenapi: opts.spec });
    });

  toolCmd.command('exec <id>')
    .description('Execute a tool directly')
    .option('--params <json>', 'Tool parameters as JSON')
    .action(async (id: string, opts: { params?: string }) => {
      const { execTool } = await import('./tool/exec.js');
      // execTool(dataSourceId, toolId, opts) — dataSourceId left undefined (original command only passed tool id)
      await execTool(undefined as unknown as string, id, { args: opts.params });
    });
}
