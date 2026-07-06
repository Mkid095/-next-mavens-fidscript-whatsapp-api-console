/**
 * messagesCommands.ts — Message sending commands
 */
import type { Command } from 'commander';

export async function register(target: Command): Promise<void> {
  const msgCmd = target.command('message').description('Send messages');
  const sendCmd = target.command('send').description('Send a message (alias for `message`)');
  const { registerSendCommands } = await import('./messages/send.js');
  registerSendCommands(sendCmd);
  registerSendCommands(msgCmd);
}
