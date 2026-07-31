import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSchema } from './schema.js';
import { seedData } from './seed.js';
import { runWorkspaceMigrations } from '../modules/platform/workspace/migrations.js';
import { runPhase3Migrations } from './phase3.js';
import { runPhase5Migrations } from './phase5.js';
import { runPhase6Migrations } from './phase6.js';
import { runPhase7Migrations } from './phase7.js';
import { runPhase8Migrations } from './phase8.js';
import { runPhase32Migrations } from './phase32.js';
import { runPhase37Migrations } from './phase37.js';
import { runPhase38Migrations } from './phase38.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'fidscript.db');

let db: SqlJsDatabase | null = null;

export async function initializeDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  createSchema(db);
  runWorkspaceMigrations(db); // workspace + RBAC + customer + conversation tables
  runPhase3Migrations(db);     // customer_assignments + SLA timing columns
  runPhase5Migrations(db);     // campaign type/workspace_id + segments/steps/triggers/media_assets/status_posts skeletons
  runPhase6Migrations(db);     // webhooks + webhook_deliveries + api_logs latency/workspace
  runPhase7Migrations(db);     // P11 airtight: workspace_id on customer_tags/notes/assignments
  runPhase8Migrations(db);     // Group sync: cached_group_info + cached_participants
  runPhase32Migrations(db);     // Billing control plane: token_action_costs table
  runPhase37Migrations(db);    // Webhook delivery ID dedup table
  runPhase38Migrations(db);    // LID column for outbox tracking
  await seedData(db);
  saveDatabase();

  console.log('✅ Database initialized successfully');
  return db;
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

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
