/**
 * phase34.ts — Add 'connector' tool type + auto-register connector tools.
 *
 * Adds 'connector' to the CHECK constraint on tools.type, enabling
 * tool executors to dispatch to the ConnectorRegistry at runtime.
 *
 * Also auto-creates tools in the tools table for each connector's
 * actions so chatbots can attach them without manual data source setup.
 */
import type { Database } from 'sql.js';

export function runPhase34Migrations(db: Database): void {
  // 1. Expand tools.type to include 'connector'
  db.run(`
    CREATE TABLE IF NOT EXISTS _tools_new (
      id TEXT PRIMARY KEY,
      data_source_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lookup','search','query','action','workflow','connector')),
      parameters_json TEXT NOT NULL DEFAULT '{"type":"object","properties":{}}',
      executor_json TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    INSERT INTO _tools_new SELECT * FROM tools
  `);
  db.run('DROP TABLE tools');
  db.run('ALTER TABLE _tools_new RENAME TO tools');

  // 2. Create default data sources for each registered connector
  const connectors: Array<{ id: string; slug: string; actions: Array<{ name: string; label: string; description: string; endpoint: string; method: string }> }> = [
    {
      id: 'conn_shopify',
      slug: 'shopify',
      actions: [
        { name: 'shopify.get_order', label: 'Look up order', description: 'Retrieve order status and details', endpoint: 'https://{shop}.myshopify.com/admin/api/2024-01/orders.json', method: 'GET' },
        { name: 'shopify.search_products', label: 'Search products', description: 'Search the product catalog', endpoint: 'https://{shop}.myshopify.com/admin/api/2024-01/products.json', method: 'GET' },
        { name: 'shopify.get_customer', label: 'Get customer', description: 'Retrieve customer profile', endpoint: 'https://{shop}.myshopify.com/admin/api/2024-01/customers.json', method: 'GET' },
      ],
    },
    {
      id: 'conn_woocommerce',
      slug: 'woocommerce',
      actions: [
        { name: 'woocommerce.get_order', label: 'Look up order', description: 'Retrieve order by ID', endpoint: '', method: 'GET' },
        { name: 'woocommerce.search_products', label: 'Search products', description: 'Search the product catalog', endpoint: '', method: 'GET' },
        { name: 'woocommerce.get_customer', label: 'Get customer', description: 'Retrieve customer by email', endpoint: '', method: 'GET' },
      ],
    },
  ];

  for (const conn of connectors) {
    // Check if already seeded
    const existing = db.exec(
      `SELECT id FROM data_sources WHERE type = 'connector' AND workspace_id = 'system' LIMIT 1`
    );
    if (existing.length > 0 && existing[0].values.length > 0) continue;

    const dsId = `ds_${conn.slug}_system`;
    db.run(`
      INSERT INTO data_sources (id, workspace_id, name, description, type, config_json, enabled, created_at, updated_at)
      VALUES ('${dsId}', 'system', '${conn.slug}', 'Auto-created by phase34', 'connector', '${JSON.stringify({ connectorId: conn.id, connectorSlug: conn.slug })}', 1, datetime('now'), datetime('now'))
    `);

    for (const action of conn.actions) {
      const toolId = `tool_${conn.slug}_${action.name.split('.')[1]}`;
      db.run(`
        INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json, enabled, created_at)
        VALUES (
          '${toolId}', '${dsId}', '${action.name}', '${action.description.replace(/'/g, "''")}',
          'connector',
          '${JSON.stringify({ endpoint: action.endpoint, method: action.method })}',
          '${JSON.stringify({ connectorSlug: conn.slug, action: action.name })}',
          1, datetime('now')
        )
      `);
    }
  }
}
