/**
 * Phase 29: Relax LLM provider CHECK constraints
 *
 * SQLite cannot ALTER a CHECK constraint in-place. To allow new provider types
 * (minimax, openrouter, ollama, custom) on existing databases, we recreate the
 * two affected tables with relaxed constraints and copy data over.
 *
 * This is idempotent — if the constraints already match, the copy is a no-op.
 */
import type { Database } from 'sql.js';

export function runPhase29Migrations(db: Database): void {

  // ─── llm_provider_registry: add 'minimax' to CHECK ───────────────────────────
  // Only recreate if the constraint doesn't include 'minimax'. Uses a marker
  // comment in the schema to avoid re-running on every restart.

  try {
    // Clean up any leftover _old table from a previous failed migration
    db.run(`DROP TABLE IF EXISTS llm_provider_registry_old`);

    const schema = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='llm_provider_registry'");
    const currentSql = (schema[0]?.values[0]?.[0] as string | undefined) ?? '';

    // Skip if already migrated (has both 'minimax' in CHECK and 'is_shared')
    if (!currentSql.includes('minimax') || !currentSql.includes('is_shared')) {
      db.run('ALTER TABLE llm_provider_registry RENAME TO llm_provider_registry_old');
      db.run(`CREATE TABLE llm_provider_registry (
        id TEXT PRIMARY KEY,
        provider_type TEXT NOT NULL
          CHECK(provider_type IN ('openai','openrouter','anthropic','azure','gemini','ollama','custom','minimax')),
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        base_url TEXT DEFAULT '',
        auth_type TEXT DEFAULT 'bearer'
          CHECK(auth_type IN ('bearer','api_key','oauth','azure_ad')),
        api_key_encrypted TEXT,
        api_key_last4 TEXT DEFAULT '',
        iv TEXT DEFAULT '',
        auth_tag TEXT DEFAULT '',
        key_version INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        is_free_tier INTEGER DEFAULT 0,
        free_quota_tokens INTEGER DEFAULT 0,
        is_shared INTEGER DEFAULT 0,
        config_json TEXT DEFAULT '{}',
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
      // Copy data — handle both old (no is_shared) and newer schemas
      db.run(`INSERT INTO llm_provider_registry
        (id, provider_type, name, description, base_url, auth_type, api_key_encrypted, api_key_last4,
         iv, auth_tag, key_version, is_default, is_free_tier, free_quota_tokens, config_json, enabled, created_at, updated_at)
        SELECT
         id, provider_type, name, description, base_url, auth_type, api_key_encrypted, api_key_last4,
         iv, auth_tag, key_version, is_default, is_free_tier, free_quota_tokens, config_json, enabled, created_at, updated_at
        FROM llm_provider_registry_old`);
      db.run('DROP TABLE llm_provider_registry_old');
      console.log('  [phase29] llm_provider_registry recreated with minimax + is_shared');
    }
  } catch (e) {
    console.log('  [phase29] llm_provider_registry migration skipped:', String(e));
  }

  // ─── llm_connections: relax provider CHECK ────────────────────────────────────

  try {
    // Clean up any leftover _old table from a previous failed migration
    db.run(`DROP TABLE IF EXISTS llm_connections_old`);

    const schema = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='llm_connections'");
    const currentSql = schema[0]?.values[0]?.[0] as string | undefined;

    // The old constraint only allowed ('gemini','openai','anthropic','azure','byollm')
    if (currentSql && !currentSql.includes('openrouter')) {
      db.run('ALTER TABLE llm_connections RENAME TO llm_connections_old');
      db.run(`CREATE TABLE llm_connections (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        provider TEXT NOT NULL
          CHECK(provider IN ('gemini','openai','anthropic','azure','openrouter','ollama','minimax','custom','byollm')),
        api_key_encrypted TEXT,
        api_key_last4 TEXT DEFAULT '',
        model TEXT DEFAULT '',
        endpoint TEXT DEFAULT '',
        key_version INTEGER DEFAULT 1,
        iv TEXT DEFAULT '',
        auth_tag TEXT DEFAULT '',
        provider_registry_id TEXT,
        is_default INTEGER DEFAULT 0,
        monthly_limit INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        enabled INTEGER DEFAULT 1,
        config_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
      // Copy existing rows (handle columns that may not exist in very old rows)
      db.run(`INSERT INTO llm_connections
        (id, workspace_id, name, provider, api_key_encrypted, api_key_last4, model, endpoint,
         key_version, iv, auth_tag, provider_registry_id, is_default, monthly_limit, priority,
         enabled, config_json, created_at, updated_at)
        SELECT
         id, workspace_id, name, provider, api_key_encrypted, api_key_last4, model, endpoint,
         key_version, iv, auth_tag, provider_registry_id, is_default, monthly_limit, priority,
         enabled, config_json, created_at, updated_at
        FROM llm_connections_old`);
      db.run('DROP TABLE llm_connections_old');
      console.log('  [phase29] llm_connections CHECK constraint updated');
    }
  } catch (e) {
    console.log('  [phase29] llm_connections migration skipped:', String(e));
  }

  // ─── Remove old seeded providers (clean slate) ───────────────────────────────
  // The old migrations seeded 6 providers without API keys. Remove them so admin
  // starts empty. llm_provider_models cascades via FK ON DELETE CASCADE.
  try {
    const oldSeeds = ['prov_gemini', 'prov_openai', 'prov_openrouter', 'prov_anthropic', 'prov_azure', 'prov_ollama'];
    for (const id of oldSeeds) {
      try {
        // Clear FK references first (llm_connections.provider_registry_id)
        db.run(`UPDATE llm_connections SET provider_registry_id = NULL WHERE provider_registry_id = ?`, [id]);
        db.run(`DELETE FROM llm_provider_models WHERE provider_registry_id = ?`, [id]);
        db.run(`DELETE FROM llm_provider_registry WHERE id = ?`, [id]);
      } catch (_) { /* individual provider may not exist */ }
    }
    console.log('  [phase29] removed old seeded providers (clean slate)');
  } catch (e) {
    console.log('  [phase29] provider cleanup error:', String(e));
  }

  // ─── Add missing columns to chatbot_contact_assignments ────────────────────
  // Original phase9 schema was missing the 'mode' column that phase13 expects.
  try {
    const cols = db.exec("PRAGMA table_info(chatbot_contact_assignments)");
    const colNames = cols[0]?.values.map((r) => String(r[1])) ?? [];
    if (!colNames.includes('mode')) {
      db.run(`ALTER TABLE chatbot_contact_assignments ADD COLUMN mode TEXT NOT NULL DEFAULT 'ai' CHECK(mode IN ('ai','manual','disabled'))`);
      console.log('  [phase29] added mode column to chatbot_contact_assignments');
    }
    if (!colNames.includes('assigned_at')) {
      db.run(`ALTER TABLE chatbot_contact_assignments ADD COLUMN assigned_at TEXT DEFAULT CURRENT_TIMESTAMP`);
    }
  } catch (_) { /* ok */ }

  // ─── Add is_shared column (FIDScript default provider toggle) ────────────────
  // When is_shared = 1, the provider is available to all clients as a
  // "FIDScript default" they can use without their own API key.
  try {
    const cols = db.exec("PRAGMA table_info(llm_provider_registry)");
    const hasShared = cols[0]?.values.some((row) => row[1] === 'is_shared');
    if (!hasShared) {
      db.run(`ALTER TABLE llm_provider_registry ADD COLUMN is_shared INTEGER DEFAULT 0`);
      console.log('  [phase29] added is_shared column to llm_provider_registry');
    }
  } catch (_) { /* ok */ }

  // ─── Add llm_connection_id to chatbot_ai_configs ────────────────────────────
  // This connects the chatbot builder's LLM selection to the runtime gateway.
  try {
    const cols = db.exec("PRAGMA table_info(chatbot_ai_configs)");
    const hasConnId = cols[0]?.values.some((row) => row[1] === 'llm_connection_id');
    if (!hasConnId) {
      db.run(`ALTER TABLE chatbot_ai_configs ADD COLUMN llm_connection_id TEXT`);
      console.log('  [phase29] added llm_connection_id column to chatbot_ai_configs');
    }
  } catch (_) { /* ok */ }

  console.log('Phase 29 migrations complete (relaxed LLM provider constraints)');
}
