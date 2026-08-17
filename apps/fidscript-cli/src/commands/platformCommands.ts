/**
 * platformCommands.ts - Developer platform commands
 * customers, conversations, analytics, webhooks
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  // fidscript customers list
  target.command('customers [id]')
    .description('List customers or get one by ID')
    .option('--page <n>', 'Page number')
    .option('--limit <n>', 'Results per page')
    .action(async (id: string | undefined, opts: { page?: string; limit?: string }) => {
      const { listCustomers, getCustomer } = await import('./customers.js');
      if (id) {
        await getCustomer(id);
      } else {
        await listCustomers({
          page: opts.page ? parseInt(opts.page) : undefined,
          limit: opts.limit ? parseInt(opts.limit) : undefined,
        });
      }
    });

  // fidscript conversations list
  target.command('conversations')
    .description('List conversations')
    .option('--status <s>', 'Filter by status (open, pending, resolved, closed)')
    .option('--priority <p>', 'Filter by priority (urgent, high, medium, low)')
    .option('--page <n>', 'Page number')
    .option('--limit <n>', 'Results per page')
    .action(async (opts: { status?: string; priority?: string; page?: string; limit?: string }) => {
      const { listConversations } = await import('./conversations.js');
      await listConversations({
        status: opts.status,
        priority: opts.priority,
        page: opts.page ? parseInt(opts.page) : undefined,
        limit: opts.limit ? parseInt(opts.limit) : undefined,
      });
    });

  // fidscript analytics
  target.command('analytics')
    .description('Show today\'s analytics overview')
    .action(async () => {
      const { analyticsOverview } = await import('./analytics.js');
      await analyticsOverview();
    });

  // fidscript webhooks list
  const webhooks = target.command('webhooks').description('Manage webhooks');

  webhooks.command('list')
    .description('List all webhooks')
    .action(async () => {
      const { listWebhooks } = await import('./webhooks.js');
      await listWebhooks();
    });

  webhooks.command('create <url> [events...]')
    .description('Create a webhook. Events default to ["*"]')
    .action(async (url: string, events: string[] = ['*']) => {
      const { createWebhook } = await import('./webhooks.js');
      await createWebhook(url, events);
    });

  webhooks.command('delete <id>')
    .description('Delete a webhook by ID')
    .action(async (id: string) => {
      const { deleteWebhook } = await import('./webhooks.js');
      await deleteWebhook(id);
    });
}
