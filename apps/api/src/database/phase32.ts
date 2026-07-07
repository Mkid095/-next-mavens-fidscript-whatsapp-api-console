/**
 * Phase 32: Billing Control Plane — token_action_costs table
 *
 * Adds the configurable per-action token cost table that replaces
 * hardcoded values in tokenCosts.ts, billingService.ts, and billing.ts.
 *
 * Also seeds default values matching the existing hardcoded costs so
 * runtime behavior is unchanged until an admin changes them.
 */
import type { Database } from 'sql.js';

export function runPhase32Migrations(db: Database): void {
  // ─── token_action_costs ─────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS token_action_costs (
      id           TEXT PRIMARY KEY,
      action       TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      token_cost   INTEGER NOT NULL DEFAULT 1,
      category     TEXT NOT NULL DEFAULT 'whatsapp',
      description  TEXT DEFAULT '',
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── Seed default costs (idempotent — only inserts when action is new) ───────
  type CostRow = [id: string, action: string, display: string, cost: number, category: string, desc: string];

  const defaults: CostRow[] = [
    // WhatsApp message tokens (was tokenCosts.ts)
    ['c_whatsapp_text',      'whatsapp.text',      'WhatsApp Text Message',          1, 'whatsapp', 'Inbound or outbound plain text'],
    ['c_whatsapp_media',     'whatsapp.media',     'WhatsApp Media Message',         2, 'whatsapp', 'Photo, video, document'],
    ['c_whatsapp_location',  'whatsapp.location',  'WhatsApp Location',               1, 'whatsapp', 'Location pin message'],
    ['c_whatsapp_contact',   'whatsapp.contact',   'WhatsApp Contact',               1, 'whatsapp', 'vCard contact share'],
    ['c_whatsapp_reaction', 'whatsapp.reaction', 'WhatsApp Reaction',               1, 'whatsapp', 'Emoji reaction'],
    ['c_whatsapp_poll',     'whatsapp.poll',     'WhatsApp Poll',                   1, 'whatsapp', 'Native poll message'],
    ['c_whatsapp_list',     'whatsapp.list',     'WhatsApp List Message',           1, 'whatsapp', 'List reply button'],
    ['c_whatsapp_audio',    'whatsapp.audio',    'WhatsApp Audio/Voice',            2, 'whatsapp', 'Audio or voice note'],
    ['c_whatsapp_sticker',  'whatsapp.sticker',  'WhatsApp Sticker',                2, 'whatsapp', 'Static or animated sticker'],
    ['c_whatsapp_status',   'whatsapp.status',   'WhatsApp Status Story',           2, 'whatsapp', 'Status/story post'],
    // AI usage units (was billingService.ts + billing.ts)
    ['c_ai_reply',          'ai.reply',           'AI Reply',                        10, 'ai', 'Full AI-generated response'],
    ['c_ai_dataset_search',  'ai.dataset_search',  'AI Dataset Search',                2, 'ai', 'Knowledge base query'],
    ['c_ai_tool_call',      'ai.tool_call',       'AI Tool Call',                    2, 'ai', 'Tool/function execution'],
    ['c_ai_memory_save',    'ai.memory_save',     'AI Memory Save',                  1, 'ai', 'Conversation memory write'],
    ['c_ai_knowledge_search','ai.knowledge_search','AI Knowledge Search',             1, 'ai', 'Knowledge graph query'],
  ];

  const existing = db.exec('SELECT action FROM token_action_costs');
  const existingActions = new Set<string>();
  if (existing.length > 0) {
    for (const row of existing[0].values) existingActions.add(String(row[0]));
  }

  const now = new Date().toISOString();
  let inserted = 0;
  for (const [id, action, display, cost, category, desc] of defaults) {
    if (!existingActions.has(action)) {
      db.run(`
        INSERT INTO token_action_costs
          (id, action, display_name, token_cost, category, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `, [id, action, display, cost, category, desc, now, now]);
      inserted++;
    }
  }
  console.log(`  [phase32] token_action_costs: seeded ${inserted} default costs`);

  // ─── Add updated_at trigger for token_action_costs ──────────────────────────
  // (sql.js doesn't support CREATE TRIGGER across all versions cleanly, so we
  // update updated_at manually in the service layer.)

  console.log('Phase 32 migrations complete (token_action_costs table)');
}
