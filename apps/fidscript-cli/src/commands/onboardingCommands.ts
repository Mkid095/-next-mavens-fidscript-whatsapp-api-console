/**
 * onboardingCommands.ts — First-run setup and init commands
 */
import type { Command } from 'commander';

export function register(target: Command): void {
  target.command('setup')
    .description('Onboarding summary')
    .option('--reveal', 'Print the full API key (otherwise masked)', false)
    .action(async (opts: { reveal: boolean }) => {
      const { setup } = await import('./setup/setup.js');
      await setup(opts);
    });

  target.command('init')
    .description('First-run onboarding: orchestrator for login + setup')
    .option('--email <email>', 'Email for sign-in')
    .option('--code <digits>', 'Magic code from email')
    .action(async (opts: { email?: string; code?: string }) => {
      const { init } = await import('./init.js');
      await init(opts);
    });
}
