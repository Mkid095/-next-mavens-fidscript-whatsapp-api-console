import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'fidscript.db');

async function createAccounts() {
  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const adminHash = bcrypt.hashSync('Elishiba@95', 10);
  const clientHash = bcrypt.hashSync('Elishiba@95', 10);

  // Create admin account
  try {
    db.run('INSERT OR REPLACE INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['usr_admin_001', 'revccnt@gmail.com', adminHash, 'Kennedy Mwangi', 'admin', new Date().toISOString()]
    );
    console.log('✅ Admin account created: revccnt@gmail.com');
  } catch(e) {
    console.log('Admin error:', e.message);
  }

  // Create client account
  const clientId = 'cli_kennedy_001';
  const apiKey = `fidscript_${Math.random().toString(16).substring(2, 20)}`;

  try {
    db.run(`
      INSERT OR REPLACE INTO clients (id, name, email, phone, password_hash, token_balance, is_active, api_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientId, 'Kennedy Mwangi', 'kennedygithinjioffice@gmail.com', '0746269657', clientHash, 500, 1, apiKey, new Date().toISOString()]
    );
    console.log('✅ Client account created: kennedygithinjioffice@gmail.com');

    // Record welcome bonus
    db.run(`
      INSERT INTO token_transactions (id, client_id, type, amount, reference, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [`txn_welcome_${Date.now()}`, clientId, 'welcome_bonus', 500, 'Welcome bonus', 'completed', new Date().toISOString()]
    );
    console.log('✅ Welcome bonus recorded');
  } catch(e) {
    console.log('Client error:', e.message);
  }

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('✅ Database saved');
  console.log('Done!');
  process.exit(0);
}

createAccounts();