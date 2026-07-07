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
import { runPhase9Migrations } from './phase9.js';
import { runPhase10Migrations } from './phase10.js';
import { runPhase11Migrations } from './phase11.js';
import { runPhase12Migrations } from './phase12.js';
import { runPhase13Migrations } from './phase13.js';
import { runPhonebookMigrations } from './phonebook.js';
import { runEmailLogMigrations } from './emailLog.js';
import { runPhase14Migrations } from './phase14.js';
import { runPhase15bMigrations } from './phase15b.js';
import { runPhase15cMigrations } from './phase15c.js';
import { runPhase16Migrations } from './phase16.js';
import { runPhase17Migrations } from './phase17.js';
import { runPhase18Migrations } from './phase18.js';
import { runPhase19Migrations } from './phase19.js';
import { runPhase20Migrations } from './phase20.js';
import { runPhase21Migrations } from './phase21.js';
import { runPhase22Migrations } from './phase22.js';
import { runPhase23Migrations } from './phase23.js';
import { runPhase24Migrations } from './phase24.js';
import { runPhase25Migrations } from './phase25.js';
import { runPhase26Migrations } from './phase26.js';
import { runPhase27Migrations } from './phase27.js';
import { runPhase28Migrations } from './phase28.js';
import { runPhase29Migrations } from './phase29.js';
import { runPhase31Migrations } from './phase31.js';
import { runPhase32Migrations } from './phase32.js';
import { runPhase33Migrations } from './phase33.js';
import { runPhase34Migrations } from './phase34.js';
import { runPhase35Migrations } from './phase35.js';
import { runPhase36Migrations } from './phase36.js';
import { runPhase37Migrations } from './phase37.js';

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
  runPhase9Migrations(db);     // Chatbot platform: 25 tables
  runPhase10Migrations(db);    // Multi-provider LLM: provider_registry + llm_connections extensions
  runPhase11Migrations(db);    // Runtime contracts: fallback chains + model registry
  runPhase12Migrations(db);    // Chatbot → llm_connection linkage
  runPhase13Migrations(db);    // LLM model configs + API formats + group settings + contact assignments
  runPhonebookMigrations(db);  // contacts.instance_id for WhatsApp phonebook sync
  runEmailLogMigrations(db);     // email_send_log: every send (success/failure) audited
  runPhase14Migrations(db);     // Draft autosave + publish jobs + runtime artifacts
  runPhase15bMigrations(db);    // Job recovery: heartbeat, worker_id, retry_count
  runPhase15cMigrations(db);    // Knowledge index versioning
  runPhase16Migrations(db);    // Runtime cache + tool failures + conversation locks
  runPhase17Migrations(db);    // Token usage + forecasting
  runPhase18Migrations(db);    // Runtime traces + AI response explainability
  runPhase19Migrations(db);     // Human takeover mode
  runPhase20Migrations(db);     // Production-grade handoff (expiry, resume policies, timeline)
  runPhase21Migrations(db);     // Override history (status/ended_at/ended_reason/source) + auto-takeover
  runPhase22Migrations(db);     // Conversation assignments table
  runPhase23Migrations(db);     // Contact identity layer: identifiers + sources
  runPhase24Migrations(db);     // chatbot_group_settings: respond_mode + group_jid
  runPhase25Migrations(db);     // Chatbot handoff notification config
  runPhase26Migrations(db);     // data_sources + tools + chatbot_tools
  runPhase27Migrations(db);     // tool security: approved + requires_confirmation
  runPhase28Migrations(db);     // inspector: message_id on traces + metadata versions + skip_reason
  runPhase29Migrations(db);     // Relax LLM provider CHECK constraints
  runPhase31Migrations(db);     // Seed FIDScript customer-care agent
  runPhase32Migrations(db);     // Billing control plane: token_action_costs table
  runPhase33Migrations(db);     // Connector credentials table
  runPhase34Migrations(db);     // Connector tool type + auto-seeded tools
  runPhase35Migrations(db);    // Connector events table
  runPhase36Migrations(db);    // Connector event retry metadata
  runPhase37Migrations(db);    // Webhook delivery ID dedup table
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
