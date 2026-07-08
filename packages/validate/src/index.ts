#!/usr/bin/env node
/**
 * FIDScript Platform Validation Suite
 *
 * Usage:
 *   node dist/index.js [--json] [--git-sha SHA]
 *
 * Environment variables (or set in .env):
 *   PLATFORM_API_URL    — SaaS backend (e.g. https://apiwhatsapp.fidscript.com)
 *   WHATSAPP_API_URL    — WhatsApp API (e.g. http://localhost:3099)
 *   WHATSAPP_API_KEY    — Evolution API key
 *   ADMIN_EMAIL        — admin login email
 *   ADMIN_PASSWORD     — admin login password
 *   TEST_WHATSAPP_NUMBER — recipient for messaging tests (e.g. +254700000000)
 */

import { createClients } from './client/http.js';
import { infraTests } from './tests/infrastructure.js';
import { authTests } from './tests/auth.js';
import { whatsAppTests } from './tests/whatsapp.js';
import { messagingTests } from './tests/messaging.js';
import { printSummary } from './format/table.js';
import type { TestCollection, EnvConfig } from './types.js';

// Load env from .env if present (for local dev)
try {
  const { config } = await import('dotenv');
  config();
} catch {
  // dotenv optional
}

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const gitShaArg = args[args.indexOf('--git-sha') + 1] ?? undefined;

const env: EnvConfig = {
  platformApiUrl: process.env.PLATFORM_API_URL ?? 'https://apiwhatsapp.fidscript.com',
  whatsappApiUrl: process.env.WHATSAPP_API_URL ?? 'http://localhost:3099',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  testWorkspacePrefix: process.env.TEST_WORKSPACE_PREFIX ?? 'e2e',
  testWhatsAppNumber: process.env.TEST_WHATSAPP_NUMBER,
};

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY ?? '94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8';

async function main() {
  if (!jsonMode) {
    console.log('\nFIDScript Platform Validation Suite\n');
    console.log(`Platform API : ${env.platformApiUrl}`);
    console.log(`WhatsApp API: ${env.whatsappApiUrl}`);
    console.log(`WhatsApp Key: ${WHATSAPP_API_KEY.slice(0, 8)}...`);
    console.log('');
  }

  const collections: TestCollection[] = [];
  const authTokens: { adminToken?: string; clientToken?: string } = {};

  const { platform, whatsapp } = createClients(env);

  // Infrastructure
  collections.push(await infraTests(platform, whatsapp));

  // Authentication
  collections.push(await authTests(platform, env, authTokens));

  // WhatsApp instance lifecycle
  const waCtx: { instanceName?: string } = {};
  collections.push(await whatsAppTests(whatsapp, WHATSAPP_API_KEY, waCtx));

  // Messaging (skip if no connected instance)
  if (waCtx.instanceName) {
    collections.push(await messagingTests(whatsapp, WHATSAPP_API_KEY, waCtx.instanceName));
  }

  // Print results
  const { failed } = printSummary(collections, {
    json: jsonMode,
    gitSha: gitShaArg,
  });

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Validation suite crashed:', err);
  process.exit(1);
});
