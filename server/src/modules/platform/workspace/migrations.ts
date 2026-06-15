import type { Database } from 'sql.js';
import { createWorkspaceTables, seedWorkspaceData } from './tables.js';

// =============================================================================
// Workspace migrations — extend existing tables for multi-workspace / RBAC
// All migrations are guarded: ALTER TABLE ADD COLUMN IF NOT EXISTS (sqlite pattern)
// =============================================================================

export function runWorkspaceMigrations(db: Database): void {
  createWorkspaceTables(db);
  seedWorkspaceData(db);

  // Extend existing users table with workspace fields
  // (existing 'role' column becomes legacy; new system uses workspace_members + roles)
  try { db.run('ALTER TABLE users ADD COLUMN avatar_url TEXT'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE users ADD COLUMN default_workspace_id TEXT'); } catch (_) { /* ok */ }

  // Extend audit_logs with workspace + before/after (distinct from domain_events)
  try { db.run("ALTER TABLE audit_logs ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE audit_logs ADD COLUMN actor_user_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE audit_logs ADD COLUMN before_json TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE audit_logs ADD COLUMN after_json TEXT"); } catch (_) { /* ok */ }

  // Extend existing tables with workspace_id (client_id = workspace_id bridge)
  try { db.run("ALTER TABLE instances ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE inbox_messages ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE contacts ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE campaigns ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE client_api_keys ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE token_transactions ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }
  try { db.run("ALTER TABLE payments ADD COLUMN workspace_id TEXT"); } catch (_) { /* ok */ }

  // domain_events table (new — created if not exists)
  db.run(`
    CREATE TABLE IF NOT EXISTS domain_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      type TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      customer_id TEXT,
      conversation_id TEXT,
      actor_user_id TEXT,
      payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // customers table (new)
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      primary_identifier_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT
    )
  `);

  // customer_identifiers table (new)
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_identifiers (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // conversations table (new)
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      instance_id TEXT,
      chat_id TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      assignee_type TEXT DEFAULT 'unassigned',
      assignee_id TEXT,
      team_id TEXT,
      unread_count INTEGER DEFAULT 0,
      last_message_at TEXT,
      ai_state TEXT DEFAULT 'human_active',
      active_agent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // customer_tags (new)
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_tags (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // customer_notes (new)
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_notes (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      author_user_id TEXT,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // sla_policies (new)
  db.run(`
    CREATE TABLE IF NOT EXISTS sla_policies (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      channel TEXT,
      priority TEXT,
      first_response_minutes INTEGER DEFAULT 60,
      resolution_minutes INTEGER DEFAULT 480,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // automation_flows, automation_nodes, automation_edges, automation_executions (reserved Phase 2)
  db.run(`
    CREATE TABLE IF NOT EXISTS automation_flows (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trigger_event TEXT,
      enabled INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS automation_nodes (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS automation_edges (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      label TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS automation_executions (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      customer_id TEXT,
      conversation_id TEXT,
      status TEXT DEFAULT 'running',
      current_node_ids TEXT,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      context TEXT
    )
  `);

  // ai_agents (reserved Phase 4 — schema exists now)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_agents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      model TEXT,
      triggers TEXT,
      default_action_set TEXT,
      enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agent_permissions (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action TEXT NOT NULL,
      UNIQUE(agent_id, action)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_sources (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      ref TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ai_keyword_rules (Phase 2 — simple keyword → reply + handoff)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_keyword_rules (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      reply TEXT NOT NULL,
      confidence_threshold REAL DEFAULT 0.7,
      escalate_on_low_confidence INTEGER DEFAULT 1,
      set_ai_state TEXT DEFAULT 'escalated',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // integrations (reserved Phase 6)
  db.run(`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      connector TEXT NOT NULL,
      name TEXT NOT NULL,
      credentials_ref TEXT,
      status TEXT DEFAULT 'disconnected',
      last_synced_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS integration_events (
      id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      external_id TEXT,
      type TEXT NOT NULL,
      payload TEXT,
      ingested_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // search_index (Phase 2 — FTS added in indexes.ts)
  db.run(`
    CREATE TABLE IF NOT EXISTS search_index (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      body TEXT,
      tags TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // -------------------------------------------------------------------------
  // Indexes on platform tables. These MUST run here (after table/column
  // creation), not in database/indexes.ts — those tables/columns do not exist
  // at createSchema() time, so indexing them there would crash a fresh DB.
  // -------------------------------------------------------------------------
  // Workspace / RBAC
  db.run(`CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON workspace_members(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id)`);
  // Customers + conversations
  db.run(`CREATE INDEX IF NOT EXISTS idx_customers_ws ON customers(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_identifiers_customer ON customer_identifiers(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_identifiers_value ON customer_identifiers(value)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_ws ON conversations(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_chat ON conversations(chat_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id)`);
  // domain_events (timeline source)
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_ws ON domain_events(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_customer ON domain_events(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_conv ON domain_events(conversation_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(type)`);
  // audit_logs.workspace_id (column added above)
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON audit_logs(workspace_id)`);
  // search_index
  db.run(`CREATE INDEX IF NOT EXISTS idx_search_index_ws ON search_index(workspace_id)`);
}
