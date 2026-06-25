import type { Database } from 'sql.js';

export function createTables(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
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
      api_key TEXT UNIQUE NOT NULL, key_hash TEXT,
      plan_id TEXT REFERENCES plans(id),
      is_active INTEGER DEFAULT 1, token_balance INTEGER DEFAULT 500,
      msg_count_today INTEGER DEFAULT 0, total_messages INTEGER DEFAULT 0,
      last_reset TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: add key_hash columns if missing
  try { db.run('ALTER TABLE clients ADD COLUMN key_hash TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE client_api_keys ADD COLUMN key_hash TEXT'); } catch (e: any) { /* already exists */ }

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

  try { db.run("ALTER TABLE inbox_messages ADD COLUMN direction TEXT DEFAULT 'incoming'"); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN extra TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN raw_payload TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN chat_id TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN is_group INTEGER DEFAULT 0'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN conversation_id TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN customer_id TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run('ALTER TABLE inbox_messages ADD COLUMN workspace_id TEXT'); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE payments ADD COLUMN token_count INTEGER"); } catch (e: any) { /* already exists */ }
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
      status TEXT DEFAULT 'pending', token_count INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id TEXT PRIMARY KEY, instance_id TEXT REFERENCES instances(id),
      client_id TEXT REFERENCES clients(id), from_number TEXT NOT NULL, from_name TEXT,
      message_type TEXT DEFAULT 'text', content TEXT, media_url TEXT,
      is_read INTEGER DEFAULT 0, timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      chat_id TEXT, is_group INTEGER DEFAULT 0,
      conversation_id TEXT, customer_id TEXT, workspace_id TEXT,
      direction TEXT DEFAULT 'incoming', extra TEXT, raw_payload TEXT
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
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id TEXT PRIMARY KEY, client_id TEXT REFERENCES clients(id),
      response_json TEXT NOT NULL, status_code INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT
    )
  `);

  // Migration: add expires_at column if missing
  try { db.run('ALTER TABLE idempotency_keys ADD COLUMN expires_at TEXT'); } catch (e: any) { /* already exists */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS deploy_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      previous_version TEXT,
      commit_hash TEXT,
      deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      changes_summary TEXT,
      changelog TEXT,
      service TEXT DEFAULT 'both'
    )
  `);

  // Migration: add previous_version and changelog columns if upgrading from older schema
  try { db.run("ALTER TABLE deploy_versions ADD COLUMN previous_version TEXT"); } catch (e: any) { /* already exists */ }
  try { db.run("ALTER TABLE deploy_versions ADD COLUMN changelog TEXT"); } catch (e: any) { /* already exists */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS auth_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      purpose TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      consumed_at TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Contact groups
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_groups (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT REFERENCES contact_groups(id) ON DELETE CASCADE,
      contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, contact_id)
    )
  `);

  // Campaigns table
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      name TEXT NOT NULL,
      instance_name TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      content TEXT,
      media_url TEXT,
      caption TEXT,
      status TEXT DEFAULT 'draft',
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      total_recipients INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      group_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Campaign recipients
  db.run(`
    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id TEXT PRIMARY KEY,
      campaign_id TEXT REFERENCES campaigns(id),
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      delivered_at TEXT,
      failed_at TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
