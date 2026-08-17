/**
 * genericCommands.ts - API introspection and token commands
 */
import type { Command } from 'commander';
import type { ApiCallOpts } from './api.js';

export function register(target: Command): void {
  target.command('api <method> <path>')
    .description('Hit any API endpoint directly')
    .option('-d, --data <json-or-@file>', 'Request body')
    .option('--raw', 'Send body as raw text', false)
    .option('--auth <apikey|jwt>', 'Force auth mode')
    .option('--confirm', 'Confirm destructive methods', false)
    .action(async (method: string, path: string, opts: { data?: string; raw?: boolean; auth?: 'apikey' | 'jwt'; confirm?: boolean }) => {
      const { apiCall } = await import('./api.js');
      await apiCall({ method, path, ...opts } as ApiCallOpts);
    });

  target.command('openapi')
    .description('Fetch the live OpenAPI spec')
    .option('--format <json|yaml>', 'Output format', 'json')
    .action(async (opts: { format?: 'json' | 'yaml' }) => {
      const { openapi } = await import('./openapi.js');
      await openapi(opts);
    });

  target.command('tokens')
    .description('Show token balance and transaction history')
    .action(async () => {
      const { tokens } = await import('./tokens.js');
      await tokens();
    });

  target.command('tier').alias('quota')
    .description('Show WhatsApp tier, daily limits, usage, and token balance')
    .action(async () => {
      const { tier } = await import('./tier.js');
      await tier();
    });
}
