/**
 * commands/index.ts — Thin barrel: registers all CLI command groups.
 * Sub-modules each export a `register(target: Command): void` function
 * (messagesCommands uses `async register` for dynamic import).
 */
import type { Command } from 'commander';

import { register as registerAuth } from './authCommands.js';
import { register as registerOnboarding } from './onboardingCommands.js';
import { register as registerGeneric } from './genericCommands.js';
import { register as registerInstance } from './instanceCommands.js';
import { register as registerChatbot } from './chatbotCommands.js';
import { register as registerLlm } from './llmCommands.js';
import { register as registerTool } from './toolCommands.js';
import { register as registerDataSource } from './dataSourceCommands.js';
import { register as registerMessages } from './messagesCommands.js';
import { register as registerPlatform } from './platformCommands.js';

export function registerCommands(cli: Command): void {
  registerAuth(cli);
  registerOnboarding(cli);
  registerGeneric(cli);
  registerInstance(cli);
  registerChatbot(cli);
  registerLlm(cli);
  registerTool(cli);
  registerDataSource(cli);
  registerMessages(cli); // async — resolves send/list sub-commands dynamically
  registerPlatform(cli);
}
