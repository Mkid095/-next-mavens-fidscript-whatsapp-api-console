import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'fidscript.db');

let db: SqlJsDatabase | null = null;

// Initialize database
export async function initializeDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      max_instances INTEGER DEFAULT 1,
      max_messages_per_month INTEGER DEFAULT 1000,
      msg_per_min INTEGER DEFAULT 10,
      price_monthly REAL DEFAULT 0,
      price_yearly REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      api_key TEXT UNIQUE NOT NULL,
      plan_id TEXT REFERENCES plans(id),
      is_active INTEGER DEFAULT 1,
      msg_count_today INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      last_reset TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT,
      client_id TEXT REFERENCES clients(id),
      instance_token TEXT NOT NULL,
      status TEXT DEFAULT 'disconnected',
      phone_number TEXT,
      qr_code TEXT,
      settings TEXT DEFAULT '{}',
      webhook_url TEXT,
      webhook_enabled INTEGER DEFAULT 0,
      msg_count_today INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      last_active TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY,
      instance_id TEXT REFERENCES instances(id),
      client_id TEXT REFERENCES clients(id),
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      request_body TEXT,
      response_status INTEGER,
      response_body TEXT,
      ip_address TEXT,
      user_agent TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id TEXT PRIMARY KEY,
      instance_id TEXT REFERENCES instances(id),
      client_id TEXT REFERENCES clients(id),
      from_number TEXT NOT NULL,
      from_name TEXT,
      message_type TEXT DEFAULT 'text',
      content TEXT,
      media_url TEXT,
      is_read INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_client ON instances(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_timestamp ON inbox_messages(timestamp)`);

  // Seed default plans if none exist
  const planCount = db.exec('SELECT COUNT(*) as count FROM plans')[0]?.values[0]?.[0] as number;
  if (!planCount || planCount === 0) {
    db.run(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES ('plan_starter', 'Starter', 'Perfect for small businesses', 3, 5000, 5, 2500, 24000)
    `);
    db.run(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES ('plan_professional', 'Professional', 'For growing businesses', 10, 25000, 20, 7500, 72000)
    `);
    db.run(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES ('plan_enterprise', 'Enterprise', 'Unlimited everything', 50, 100000, 100, 25000, 240000)
    `);
  }

  // Seed default admin user if none exist
  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] as number;
  if (!userCount || userCount === 0) {
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.default.hashSync('admin123', 10);
    db.run(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES ('admin_1', 'admin@fidscript.io', ?, 'Admin', 'admin')
    `, [hash]);
  }

  // Save database to file
  saveDatabase();

  console.log('✅ Database initialized successfully');
  return db;
}

// Save database to file
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Database wrapper with sync-like API
class DatabaseWrapper {
  prepare(sql: string) {
    return {
      run: (...params: unknown[]) => {
        if (!db) throw new Error('Database not initialized');
        db.run(sql, params as (string | number | null | Uint8Array)[]);
        saveDatabase();
        return { changes: db.getRowsModified() };
      },
      get: (...params: unknown[]) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params: unknown[]) => {
        if (!db) throw new Error('Database not initialized');
        const results: Record<string, unknown>[] = [];
        const stmt = db.prepare(sql);
        stmt.bind(params as (string | number | null | Uint8Array)[]);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
      exec: () => {
        if (!db) throw new Error('Database not initialized');
        return db.exec(sql);
      },
    };
  }
}

const dbWrapper = new DatabaseWrapper();

export default dbWrapper;
