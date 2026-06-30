/**
 * Phase 15b: Job Recovery — heartbeat, worker tracking, retry count
 *
 * Adds columns to chatbot_publish_jobs to support:
 * - Detecting stale jobs (last_heartbeat_at)
 * - Tracking which worker is handling a job (worker_id)
 * - Counting retry attempts (retry_count)
 */
import type { Database } from 'sql.js';

export function runPhase15bMigrations(db: Database): void {
  try { db.run(`ALTER TABLE chatbot_publish_jobs ADD COLUMN last_heartbeat_at TEXT DEFAULT CURRENT_TIMESTAMP`); } catch (_) { /* may already exist */ }
  try { db.run(`ALTER TABLE chatbot_publish_jobs ADD COLUMN worker_id TEXT`); } catch (_) { /* may already exist */ }
  try { db.run(`ALTER TABLE chatbot_publish_jobs ADD COLUMN retry_count INTEGER DEFAULT 0`); } catch (_) { /* may already exist */ }

  console.log('✅ Phase 15b migrations complete (job recovery: heartbeat, worker_id, retry_count)');
}
