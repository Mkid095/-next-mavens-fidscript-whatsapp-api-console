import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSchema } from './schema.js';
import { seedData } from './seed.js';

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
