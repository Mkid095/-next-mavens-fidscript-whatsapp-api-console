/**
 * phase26.ts — AI Agent Tool Calling Platform
 *
 * Architecture (5 layers):
 *
 *   integration_connections  → encrypted credentials to external systems
 *   data_sources             → datasets exposed by a connection
 *   tools                    → individual operations the LLM can call
 *   tool_workflows           → multi-step tool chains (create_order → push_stk)
 *   chatbot_tools            → which tools a chatbot can use + permissions
 *   tool_execution_logs      → every tool call logged for audit
 *
 * The chatbot NEVER touches our database for customer data. Everything
 * goes through tools that call external systems (REST APIs, databases,
 * Shopify, WooCommerce, etc.).
 *
 * Tool types:
 *   lookup    — single-record fetch by key (e.g. find_customer_by_phone)
 *   search    — free-text/filtered query returning multiple records
 *   query     — arbitrary SQL or API query
 *   action    — POST/PUT/DELETE to a remote API (e.g. create_order)
 *   workflow  — multi-step chain that calls other tools in sequence
 */
import type { Database as SqlJsDatabase } from 'sql.js';

export function runPhase26Migrations(db: SqlJsDatabase): void {
  db.exec(`
    -- ── Layer 1: Integration Connections ──────────────────────────────
    -- Stores encrypted credentials for external systems.
    -- One connection = one credential set (e.g. "Shopify Prod API key",
    -- "Postgres connection string", "Custom REST API base URL + key").
    CREATE TABLE IF NOT EXISTS integration_connections (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN (
        'rest_api', 'graphql', 'postgres', 'mysql', 'sqlserver', 'mongodb',
        'shopify', 'woocommerce', 'google_sheets', 'airtable', 'custom'
      )),
      base_url TEXT,
      encrypted_config TEXT NOT NULL DEFAULT '{}',
      auth_type TEXT DEFAULT 'bearer',
      auth_header_name TEXT DEFAULT 'Authorization',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_integ_conn_workspace ON integration_connections(workspace_id);

    -- ── Layer 2: Data Sources ─────────────────────────────────────────
    -- A connection can expose multiple datasets.
    -- Example: Shopify connection → products dataset, customers dataset.
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      connection_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN (
        'api_endpoint', 'sql_table', 'sql_query', 'static_json', 'demo'
      )),
      config_json TEXT NOT NULL DEFAULT '{}',
      is_builtin INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_data_sources_workspace ON data_sources(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_data_sources_conn ON data_sources(connection_id);

    -- ── Layer 3: Tools ────────────────────────────────────────────────
    -- Individual operations the LLM can invoke.
    -- Each tool belongs to a data source and has a typed implementation.
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      data_source_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lookup','search','query','action','workflow')),
      parameters_json TEXT NOT NULL DEFAULT '{"type":"object","properties":{}}',
      executor_json TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tools_data_source ON tools(data_source_id);

    -- ── Layer 4: Tool Workflows ───────────────────────────────────────
    -- Multi-step tool chains. Example: place_order calls
    -- search_product → add_to_cart → create_order → push_stk → confirm.
    CREATE TABLE IF NOT EXISTS tool_workflows (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      steps_json TEXT NOT NULL DEFAULT '[]',
      confirmation_required INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tool_workflows_workspace ON tool_workflows(workspace_id);

    -- ── Layer 5: Chatbot Tool Attachments + Permissions ───────────────
    -- Which tools a chatbot can use + per-tool limits.
    CREATE TABLE IF NOT EXISTS chatbot_tools (
      chatbot_id TEXT NOT NULL,
      tool_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      daily_limit INTEGER DEFAULT 0,
      calls_today INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (chatbot_id, tool_id),
      FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
      FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chatbot_tools_chatbot ON chatbot_tools(chatbot_id);

    -- ── Layer 6: Execution Logs ───────────────────────────────────────
    -- Every tool call logged for audit + debugging.
    CREATE TABLE IF NOT EXISTS tool_execution_logs (
      id TEXT PRIMARY KEY,
      chatbot_id TEXT NOT NULL,
      conversation_id TEXT,
      tool_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      tool_type TEXT NOT NULL,
      input_json TEXT,
      output_json TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      duration_ms INTEGER DEFAULT 0,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tool_exec_chatbot ON tool_execution_logs(chatbot_id);
    CREATE INDEX IF NOT EXISTS idx_tool_exec_conversation ON tool_execution_logs(conversation_id);
  `);
}