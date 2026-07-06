import type { Database } from 'sql.js';
import { createTables } from './tables.js';
import { createIndexes } from './indexes.js';

export function createSchema(db: Database): void {
  createTables(db);
  createIndexes(db);
}
