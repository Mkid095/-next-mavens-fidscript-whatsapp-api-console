import { initializeDatabase } from './src/database/index.js';
import { createAuthCode } from './src/utils/authCodes.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const db = await initializeDatabase();
  const email = 'tumatest@whatsapp.fidscript.com';
  const name = 'Tuma Test';
  const phone = '254700000000';

  const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email) as { id: string } | undefined;
  if (existing) {
    console.log('Already exists:', existing.id);
  } else {
    const clientId = 'cli_tuma' + uuidv4().substring(0, 8);
    const apiKey = 'fidscript_live_' + crypto.randomBytes(24).toString('hex');
    db.prepare(
      `INSERT INTO clients (id, name, email, phone, password_hash, api_key, plan_id, token_balance, created_at) VALUES (?, ?, ?, ?, NULL, ?, NULL, 500, CURRENT_TIMESTAMP)`
    ).run(clientId, name, email, phone, apiKey);
    console.log('Created client:', clientId);
  }

  const code = createAuthCode(email, 'login');
  console.log('Magic code for', email + ':', code);
}

main().catch(console.error);
