/**
 * logout.ts — clear stored credentials (JWT + API key).
 *
 * Wipes ~/.fidscript/credentials and unsets relevant env vars.
 */
import { clearCredentials } from '../lib/credentials.js';
import { outputMsg } from '../lib/api-client.js';
import pc from 'picocolors';

export async function logout(): Promise<void> {
  clearCredentials();
  delete process.env.FIDSCRIPT_API_KEY;
  delete process.env.FIDSCRIPT_JWT;
  outputMsg('Signed out. Credentials cleared.');
  console.error(pc.dim('  Run ') + 'fidscript login' + pc.dim(' again to sign back in.'));
}