/**
 * instanceCommands.ts - WhatsApp instance lifecycle commands
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  const instanceCmd = target.command('instance').description('Manage WhatsApp instances');

  instanceCmd.command('list')
    .description('List all instances')
    .action(async () => {
      const { listInstances } = await import('./instance/list.js');
      await listInstances();
    });

  instanceCmd.command('create <name>')
    .description('Create a new WhatsApp instance')
    .option('--number <phone>', 'Phone number to link (E.164 format)')
    .action(async (name: string, opts: { number?: string }) => {
      const { createInstance } = await import('./instance/create.js');
      await createInstance(name, opts);
    });

  instanceCmd.command('qr <name>')
    .description('Generate and display QR code')
    .option('--number <phone>', 'Phone number to link')
    .action(async (name: string, opts: { number?: string }) => {
      const { qrInstance } = await import('./instance/qr.js');
      await qrInstance(name, opts);
    });

  instanceCmd.command('connect <name>')
    .description('Initiate instance connection')
    .option('--number <phone>', 'Phone number to link')
    .action(async (name: string, opts: { number?: string }) => {
      const { connectInstance } = await import('./instance/connect.js');
      await connectInstance(name, opts);
    });

  instanceCmd.command('restart <name>')
    .description('Restart an instance')
    .option('--confirm', 'Confirm the restart', false)
    .action(async (name: string, opts: { confirm: boolean }) => {
      const { restartInstance } = await import('./instance/restart.js');
      await restartInstance(name, opts);
    });

  instanceCmd.command('watch <name>')
    .description('Stream live connection state via SSE')
    .option('--timeout <seconds>', 'Stop after N seconds', parseInt)
    .action(async (name: string, opts: { timeout?: number }) => {
      const { watchInstance } = await import('./instance/watch.js');
      await watchInstance(name, opts);
    });

  instanceCmd.command('logout <name>')
    .description('Disconnect an instance')
    .action(async (name: string) => {
      const { logoutInstance } = await import('./instance/logout.js');
      await logoutInstance(name);
    });

  instanceCmd.command('delete <name>')
    .description('Permanently delete an instance')
    .option('--confirm', 'Confirm deletion', false)
    .action(async (name: string, opts: { confirm: boolean }) => {
      const { deleteInstance } = await import('./instance/delete.js');
      await deleteInstance(name, opts);
    });
}
