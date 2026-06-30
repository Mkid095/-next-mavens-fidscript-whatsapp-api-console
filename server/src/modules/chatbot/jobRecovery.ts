/**
 * Job Recovery Module
 *
 * On server startup, detects and requeues stale publish jobs that were
 * interrupted (e.g. server crash mid-pipeline).
 *
 * A job is stale if it is in an active state (not pending/done/failed)
 * and its last heartbeat is older than STALE_THRESHOLD_MS.
 *
 * Jobs are requeued by resetting status to 'pending' and incrementing
 * retry_count. Jobs that have exceeded maxRetries are marked failed.
 */
import type DatabaseWrapper from '../../database.js';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;

export async function recoverStaleJobs(db: DatabaseWrapper): Promise<void> {
  const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  // Find all stale active jobs
  const staleJobs = db.prepare(`
    SELECT id, chatbot_id, workspace_id, retry_count
    FROM chatbot_publish_jobs
    WHERE status IN ('building', 'indexing', 'compiling', 'activating')
      AND last_heartbeat_at < ?
  `).all(staleCutoff) as { id: string; chatbot_id: string; workspace_id: string; retry_count: number }[];

  if (staleJobs.length === 0) {
    console.log('[jobRecovery] No stale jobs found');
    return;
  }

  console.log(`[jobRecovery] Found ${staleJobs.length} stale job(s)`);

  for (const job of staleJobs) {
    if (job.retry_count >= MAX_RETRIES) {
      // Give up — mark permanently failed
      db.prepare(`UPDATE chatbot_publish_jobs SET
        status = 'failed',
        error = 'Max retries exceeded — job was left incomplete after server restart',
        current_step = NULL,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      ).run(job.id);
      console.log(`[jobRecovery] Job ${job.id}: marked failed (max retries)`);
    } else {
      // Requeue for retry
      db.prepare(`UPDATE chatbot_publish_jobs SET
        status = 'pending',
        progress = 0,
        current_step = NULL,
        message = NULL,
        error = NULL,
        retry_count = retry_count + 1,
        last_heartbeat_at = CURRENT_TIMESTAMP,
        worker_id = NULL,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      ).run(job.id);
      console.log(`[jobRecovery] Job ${job.id}: requeued (retry ${job.retry_count + 1}/${MAX_RETRIES})`);
    }
  }
}
