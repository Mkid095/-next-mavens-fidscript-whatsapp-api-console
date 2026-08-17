/**
 * authCommands.ts - Authentication commands (login, logout, refresh, whoami)
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  target.command('login')
    .description('Sign in with a magic code sent to your email (stores a JWT)')
    .option('--email <email>', 'Email address (prompts if not given)')
    .option('--code <digits>', 'Magic code from email')
    .action(async (opts: { email?: string; code?: string }) => {
      const { login } = await import('./login/login.js');
      await login(opts);
    });

  target.command('logout')
    .description('Clear stored credentials (JWT + API key)')
    .action(async () => {
      const { logout } = await import('./logout.js');
      await logout();
    });

  target.command('refresh')
    .description('Re-issue the JWT using the stored email')
    .option('--email <email>', 'Override the stored email')
    .option('--code <digits>', 'Submit the code without prompting (headless)')
    .action(async (opts: { email?: string; code?: string }) => {
      const { refresh } = await import('./refresh.js');
      await refresh(opts);
    });

  target.command('whoami', { isDefault: false })
    .description('Show authenticated account info')
    .action(async () => {
      const { whoami } = await import('./whoami.js');
      await whoami();
    });
}
