/**
 * phase34.ts — Add 'connector' data source + tool type.
 *
 * 1. Expands data_sources.type CHECK to include 'connector'
 * 2. Expands tools.type CHECK to include 'connector'
 * 3. Auto-creates connector data_sources + tools for Shopify and WooCommerce
 */
import type { Database } from 'sql.js';

export function runPhase34Migrations(db: Database): void {
  // ── 1. Expand data_sources.type CHECK to include 'connector' ────────────
  db.run('DROP TABLE IF EXISTS _ds_new');
  // Matches actual data_sources schema (verified from DB)
  db.run(`
    CREATE TABLE _ds_new (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      connection_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN (
        'api_endpoint', 'sql_table', 'sql_query', 'static_json', 'demo',
        'connector'
      )),
      config_json TEXT NOT NULL DEFAULT '{}',
      is_builtin INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE SET NULL
    )
  `);
  db.run(`
    INSERT INTO _ds_new
      (id, workspace_id, connection_id, name, description, type,
       config_json, is_builtin, enabled, created_at, updated_at)
    SELECT id, workspace_id, connection_id, name, description, type,
           config_json, is_builtin, enabled, created_at, updated_at
      FROM data_sources
  `);
  db.run('DROP TABLE data_sources');
  db.run('ALTER TABLE _ds_new RENAME TO data_sources');

  // ── 2. Expand tools.type CHECK to include 'connector' ───────────────────
  db.run('DROP TABLE IF EXISTS _tools_new');
  db.run(`
    CREATE TABLE _tools_new (
      id TEXT PRIMARY KEY,
      data_source_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lookup','search','query','action','workflow','connector')),
      parameters_json TEXT NOT NULL DEFAULT '{"type":"object","properties":{}}',
      executor_json TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approved INTEGER NOT NULL DEFAULT 1,
      requires_confirmation INTEGER NOT NULL DEFAULT 0,
      generator_version TEXT,
      generated_hash TEXT,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    INSERT INTO _tools_new
      (id, data_source_id, name, description, type, parameters_json, executor_json,
       enabled, created_at, approved, requires_confirmation, generator_version, generated_hash)
    SELECT id, data_source_id, name, description, type, parameters_json, executor_json,
           enabled, created_at, approved, requires_confirmation, generator_version, generated_hash
      FROM tools
  `);
  db.run('DROP TABLE tools');
  db.run('ALTER TABLE _tools_new RENAME TO tools');

  // ── 3. Auto-create connector data sources + tools ────────────────────────
  // Find first existing workspace to anchor system-level connector resources
  const wsResult = db.exec(`SELECT id FROM clients LIMIT 1`);
  const wsId = wsResult[0]?.values[0]?.[0] as string | undefined;
  if (!wsId) return; // No workspaces exist yet — skip auto-seeding

  const connectors = [
    { id: 'conn_shopify', slug: 'shopify' },
    { id: 'conn_woocommerce', slug: 'woocommerce' },
  ];

  for (const conn of connectors) {
    const existing = db.exec(
      `SELECT id FROM data_sources WHERE type = 'connector' AND workspace_id = '${wsId}' LIMIT 1`
    );
    if (existing.length > 0 && existing[0].values.length > 0) continue;

    const dsId = `ds_${conn.slug}_system`;
    db.run(`
      INSERT INTO data_sources
        (id, workspace_id, name, description, type, config_json, is_builtin, enabled, created_at, updated_at)
      VALUES (
        '${dsId}', '${wsId}', '${conn.slug}',
        'Auto-created by phase34',
        'connector',
        '{"connectorId":"${conn.id}","connectorSlug":"${conn.slug}"}',
        0, 1, datetime('now'), datetime('now')
      )
    `);

    const actions = [
      { name: `${conn.slug}.get_order`,       label: 'Look up order',      desc: 'Retrieve order status and details' },
      { name: `${conn.slug}.search_products`,  label: 'Search products',  desc: 'Search the product catalog' },
      { name: `${conn.slug}.get_customer`,     label: 'Get customer',      desc: 'Retrieve customer profile' },
    ];
    for (const a of actions) {
      const toolId = `tool_${conn.slug}_${a.name.split('.')[1]}`;
      db.run(`
        INSERT INTO tools
          (id, data_source_id, name, description, type, parameters_json, executor_json, enabled, created_at)
        VALUES (
          '${toolId}', '${dsId}', '${a.name}', '${a.desc.replace(/'/g, "''")}',
          'connector',
          '{}', '{"connectorSlug":"${conn.slug}","action":"${a.name}"}',
          1, datetime('now')
        )
      `);
    }
  }
}
