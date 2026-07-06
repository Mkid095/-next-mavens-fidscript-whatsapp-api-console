import db from '../../database.js';
import { postStatusNow, type StatusPostRow } from './statuses.js';

// =============================================================================
// Status scheduler (§15.6 — WhatsApp status posts).
// startStatusScheduler() kicks off a setInterval that, every 30s, finds
// status_posts WHERE post_state = 'scheduled' AND scheduled_at <= now,
// then calls postStatusNow(row) on each. postStatusNow handles its own
// state transitions and token charging (via the shared sendStatus sender).
//
// The 30s tick is the same cadence as the drip scheduler — it is the
// platform's "cron" and is deliberately coarse. If a status is scheduled
// for 14:23:15 and the next tick fires at 14:23:30, the status goes out
// 15 seconds late. That is acceptable for status posts; statuses are not
// transactional.
// =============================================================================

const TICK_MS = 30 * 1000;
let _interval: NodeJS.Timeout | null = null;

export function startStatusScheduler(): void {
  if (_interval) return;
  _interval = setInterval(() => { tick().catch(err => console.error('[status-scheduler] tick error:', err)); }, TICK_MS);
  tick().catch(err => console.error('[status-scheduler] initial tick error:', err));
  console.log(`✅ Status scheduler started (every ${TICK_MS / 1000}s)`);
}

export function stopStatusScheduler(): void {
  if (_interval) { clearInterval(_interval); _interval = null; }
}

async function tick(): Promise<void> {
  const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const due = db.prepare(`
    SELECT * FROM status_posts
    WHERE post_state = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= ?
    ORDER BY scheduled_at ASC
    LIMIT 50
  `).all(nowIso) as unknown as StatusPostRow[];
  if (due.length === 0) return;
  console.log(`[status-scheduler] processing ${due.length} due status post(s)`);
  for (const row of due) {
    try {
      const result = await postStatusNow(row);
      if (!result.ok) console.warn(`[status-scheduler] post ${row.id} failed: ${result.error}`);
    } catch (err) {
      console.error(`[status-scheduler] post ${row.id} threw:`, err);
    }
  }
}
