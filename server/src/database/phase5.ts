import type { Database } from 'sql.js';

// =============================================================================
// Phase 5 migrations — Marketing Center foundations.
//   - extend `campaigns` with type (broadcast/scheduled/segmented/trigger/drip)
//     + workspace_id denorm for fast tenant-scoped queries
//   - skeleton tables for segments/steps/triggers/media_assets (slices C/D/B
//     add the operational columns; schemas reserved per P9)
//   - status_posts skeleton (Slice E)
// =============================================================================

export function runPhase5Migrations(db: Database): void {
  // campaigns: type + workspace_id + created_by + template_vars + idempotency_key
  // (idempotency_key = a UUID the campaign can be replayed under, so re-launches
  //  of the same campaign don't double-charge — same model as /api/v1 sends)
  try { db.run(`ALTER TABLE campaigns ADD COLUMN type TEXT DEFAULT 'broadcast'`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE campaigns ADD COLUMN workspace_id TEXT`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE campaigns ADD COLUMN created_by TEXT`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE campaigns ADD COLUMN updated_at TEXT`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE campaigns ADD COLUMN template_vars TEXT`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE campaigns ADD COLUMN idempotency_key TEXT`); } catch (_) { /* ok */ }
  // group_id was in the original schema for tables.ts but the prod DB was
  // created from an earlier deploy that didn't have it — CREATE TABLE IF NOT
  // EXISTS is a no-op on existing tables, so the column was never added.
  try { db.run(`ALTER TABLE campaigns ADD COLUMN group_id TEXT`); } catch (_) { /* ok */ }

  db.run(`CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(workspace_id, type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(workspace_id, status)`);

  // Backfill workspace_id from client_id so existing rows are tenant-scoped.
  // client_id = workspace_id bridge (per P11 / workspace/migrations.ts).
  try { db.run(`UPDATE campaigns SET workspace_id = client_id WHERE workspace_id IS NULL`); } catch (_) { /* ok */ }

  // -------------------------------------------------------------------
  // Segments (Slice C populates the operational columns + filter resolver)
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS campaign_segments (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      filter_json TEXT NOT NULL,
      contact_count INTEGER DEFAULT 0,
      last_computed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_campaign_segments_workspace ON campaign_segments(workspace_id)`);

  // -------------------------------------------------------------------
  // Drip steps (Slice D) — sequence of actions tied to a campaign.
  // delay_seconds = wait this long after the previous step before firing.
  // action_type ∈ { send_text, send_media, add_tag, set_status, wait_branch }
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS campaign_steps (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      delay_seconds INTEGER DEFAULT 0,
      action_type TEXT NOT NULL,
      action_config TEXT,
      send_window_start TEXT,
      send_window_end TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign ON campaign_steps(campaign_id, step_order)`);

  // Per-customer enrollment in a drip campaign (Slice D).
  db.run(`
    CREATE TABLE IF NOT EXISTS drip_enrollments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      current_step INTEGER DEFAULT 0,
      enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_step_at TEXT,
      next_step_at TEXT,
      completed_at TEXT,
      state TEXT DEFAULT 'active',
      UNIQUE(customer_id, campaign_id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_drip_enrollments_next ON drip_enrollments(next_step_at, state)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_drip_enrollments_campaign ON drip_enrollments(campaign_id, state)`);

  // -------------------------------------------------------------------
  // Triggers (Slice D) — bind a campaign to a domain event.
  // event ∈ { order.created, customer.idle, customer.tagged, conversation.created }
  // filter_json narrows which events qualify (e.g. { tag: 'new_signup' })
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS campaign_triggers (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      event TEXT NOT NULL,
      filter_json TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_campaign_triggers_event ON campaign_triggers(event, enabled)`);

  // -------------------------------------------------------------------
  // Media library (Slice B) — reusable assets referenced by campaign sends.
  // kind ∈ { image, video, audio, document }
  // tags_json = array of strings; used by the MediaLibrary filter.
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      mime TEXT NOT NULL,
      url TEXT NOT NULL,
      size_bytes INTEGER,
      tags_json TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_media_assets_workspace ON media_assets(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_media_assets_kind ON media_assets(workspace_id, kind)`);

  // -------------------------------------------------------------------
  // Status posts (Slice E) — text/image/video to the WhatsApp status feed.
  // cross_post_json = array of additional instance_ids to mirror to.
  // post_state ∈ { draft, scheduled, posting, posted, failed, cancelled }
  // -------------------------------------------------------------------
  db.run(`
    CREATE TABLE IF NOT EXISTS status_posts (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      instance_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      content TEXT,
      media_id TEXT,
      caption TEXT,
      scheduled_at TEXT,
      posted_at TEXT,
      post_state TEXT DEFAULT 'draft',
      cross_post_json TEXT,
      error_message TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_status_posts_workspace ON status_posts(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_status_posts_state ON status_posts(workspace_id, post_state, scheduled_at)`);
}
