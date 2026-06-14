import type { Database } from 'sql.js';

export function createTables(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      name TEXT NOT NULL, role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_login TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
      max_instances INTEGER DEFAULT 1, max_messages_per_month INTEGER DEFAULT 1000,
      msg_per_min INTEGER DEFAULT 10, price_monthly REAL DEFAULT 0, price_yearly REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT,
      password_hash TEXT, api_key TEXT UNIQUE NOT NULL, plan_id TEXT REFERENCES plans(id),
      is_active INTEGER DEFAULT 1, token_balance INTEGER DEFAULT 500,
      msg_count_today INTEGER DEFAULT 0, total_messages INTEGER DEFAULT 0,
      last_reset TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, display_name TEXT,
      client_id TEXT REFERENCES clients(id), instance_token TEXT NOT NULL,
      status TEXT DEFAULT 'disconnected', phone_number TEXT, qr_code TEXT,
      settings TEXT DEFAULT '{}', webhook_url TEXT, webhook_enabled INTEGER DEFAULT 0,
      msg_count_today INTEGER DEFAULT 0, total_messages INTEGER DEFAULT 0,
      last_active TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: add evolution_name column if it doesn't exist
  try { db.run('ALTER TABLE instances ADD COLUMN evolution_name TEXT'); } catch (e: any) { /* already exists */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY, instance_id TEXT REFERENCES instances(id), client_id TEXT REFERENCES clients(id),
      method TEXT NOT NULL, endpoint TEXT NOT NULL, request_body TEXT,
      response_status INTEGER, response_body TEXT, ip_address TEXT, user_agent TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), action TEXT NOT NULL,
      entity_type TEXT, entity_id TEXT, details TEXT, ip_address TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS token_packages (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, tokens INTEGER NOT NULL,
      price_kes REAL NOT NULL, bonus_tokens INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS token_transactions (
      id TEXT PRIMARY KEY, client_id TEXT REFERENCES clients(id), type TEXT NOT NULL,
      amount INTEGER NOT NULL, reference TEXT, mpesa_receipt TEXT,
      status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, client_id TEXT REFERENCES clients(id),
      package_id TEXT REFERENCES token_packages(id), amount_kes REAL NOT NULL,
      phone_number TEXT NOT NULL, payhero_reference TEXT, checkout_request_id TEXT,
      status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id TEXT PRIMARY KEY, instance_id TEXT REFERENCES instances(id),
      client_id TEXT REFERENCES clients(id), from_number TEXT NOT NULL, from_name TEXT,
      message_type TEXT DEFAULT 'text', content TEXT, media_url TEXT,
      is_read INTEGER DEFAULT 0, timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY, client_id TEXT REFERENCES clients(id), phone TEXT NOT NULL,
      name TEXT, tags TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS client_api_keys (
      id TEXT PRIMARY KEY, client_id TEXT REFERENCES clients(id), name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'Active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_used TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS deploy_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      commit_hash TEXT,
      deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      changes_summary TEXT,
      service TEXT DEFAULT 'both'
    )
  `);
}
