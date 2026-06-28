/**
 * Phase 9: Conversation Automation Engine (Chatbot Platform) tables
 *
 * Core:           chatbot_configs, chatbot_ai_configs, chatbot_capabilities
 * Workflows:      chatbot_workflows, chatbot_workflow_nodes
 * Triggers:       chatbot_triggers
 * Rules:          chatbot_response_rules (conditions/actions/priority)
 * Handoff:        chatbot_handoff_rules, conversation_assignments, conversation_states
 * Assignment:     chatbot_contact_assignments, chatbot_group_settings
 * AI State:       conversation_ai_state, conversation_ai_overrides, conversation_context
 * Connections:    llm_connections (BYOLLM), data_connections
 * Knowledge:      chatbot_knowledge, chatbot_knowledge_chunks
 * Tools:          chatbot_tools, chatbot_datasets, dataset_relationships
 * Memory:         chatbot_memories, chatbot_sessions
 * Logs:           chatbot_tool_logs, chatbot_token_usage, chatbot_prompt_versions
 * Analytics:      chatbot_analytics
 * Testing:        chatbot_test_sessions
 * Versioning:     chatbot_versions
 */
import type { Database } from 'sql.js';

export function runPhase9Migrations(db: Database): void {

  // ─── Core ───────────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_configs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    config_json TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_ai_configs (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL UNIQUE,
    model TEXT DEFAULT 'gemini-2.0-flash',
    provider TEXT DEFAULT 'gemini',
    prompt TEXT DEFAULT '',
    system_prompt TEXT DEFAULT '',
    hallucination_policy TEXT DEFAULT 'balanced'
      CHECK(hallucination_policy IN ('strict','balanced','creative','disabled')),
    max_tokens INTEGER DEFAULT 2048,
    temperature REAL DEFAULT 0.7,
    top_p REAL DEFAULT 0.9,
    max_history_messages INTEGER DEFAULT 20,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_capabilities (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    capability TEXT NOT NULL
      CHECK(capability IN ('memory','knowledge','tools','datasets','handoff','intent_router')),
    enabled INTEGER DEFAULT 1,
    config_json TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chatbot_id, capability),
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Workflows (visual flow builder) ───────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_workflows (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    nodes_json TEXT DEFAULT '[]',
    edges_json TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_workflows_chatbot ON chatbot_workflows(chatbot_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_workflow_nodes (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    node_type TEXT NOT NULL
      CHECK(node_type IN ('trigger','condition','action','wait','branch','ai','message','handoff','end')),
    node_key TEXT NOT NULL,
    label TEXT DEFAULT '',
    config_json TEXT DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, node_key),
    FOREIGN KEY (workflow_id) REFERENCES chatbot_workflows(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON chatbot_workflow_nodes(workflow_id)`); } catch (_) { /* ok */ }

  // ─── Triggers ───────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_triggers (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    trigger_type TEXT NOT NULL
      CHECK(trigger_type IN ('keyword','mention','first_message','always','regex','webhook','intent')),
    trigger_value TEXT DEFAULT '',
    keyword_mode TEXT DEFAULT 'contains'
      CHECK(keyword_mode IN ('exact','contains','starts_with','regex')),
    require_previous_bot_reply INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_triggers_chatbot ON chatbot_triggers(chatbot_id)`); } catch (_) { /* ok */ }

  // ─── Response Rules (conditions / actions / priority) ───────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_response_rules (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    name TEXT DEFAULT '',
    conditions_json TEXT DEFAULT '[]'
      -- [{field: "contact.tag", operator: "contains", value: "vip"}, ...]
    action TEXT NOT NULL
      CHECK(action IN ('ai','manual','skip','workflow')),
    action_config_json TEXT DEFAULT '{}'
      -- for 'workflow': {workflow_id: "..."}
    priority INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_response_rules_chatbot ON chatbot_response_rules(chatbot_id)`); } catch (_) { /* ok */ }

  // ─── Handoff Rules ──────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_handoff_rules (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    name TEXT DEFAULT '',
    conditions_json TEXT DEFAULT '[]',
    target_team_id TEXT DEFAULT '',
    target_team_name TEXT DEFAULT '',
    priority INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Conversation States (BOT / WAITING_AGENT / AGENT / BOT_PAUSED / CLOSED) ─

  try { db.run(`CREATE TABLE IF NOT EXISTS conversation_states (
    conversation_id TEXT PRIMARY KEY,
    state TEXT NOT NULL DEFAULT 'BOT'
      CHECK(state IN ('BOT','WAITING_AGENT','AGENT','BOT_PAUSED','BOT_RESUME_PENDING','CLOSED')),
    paused_by TEXT DEFAULT '',
    paused_reason TEXT DEFAULT '',
    resumed_at TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Human Handoff Assignments ─────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS conversation_assignments (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT DEFAULT '',
    team_id TEXT DEFAULT '',
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    released_at TEXT,
    reason TEXT DEFAULT '',
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_conversation ON conversation_assignments(conversation_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_agent ON conversation_assignments(agent_id)`); } catch (_) { /* ok */ }

  // ─── Response Policies ──────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_response_policies (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL UNIQUE,
    confidence_threshold REAL DEFAULT 0.6,
    escalate_on_low_confidence INTEGER DEFAULT 1,
    requires_confirmation TEXT DEFAULT 'never'
      CHECK(requires_confirmation IN ('never','always','tool_calls','high_cost')),
    max_retries INTEGER DEFAULT 3,
    fallback_reply TEXT DEFAULT 'Sorry, I could not process your request.',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Assignment ─────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_contact_assignments (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chatbot_id, contact_id),
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_contact ON chatbot_contact_assignments(contact_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_group_settings (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    group_jid TEXT NOT NULL,
    respond_when_mentioned INTEGER DEFAULT 1,
    respond_to_all INTEGER DEFAULT 0,
    silence_on_bot_reply INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chatbot_id, group_jid),
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── AI State ───────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS conversation_ai_state (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE,
    chatbot_id TEXT,
    state_json TEXT DEFAULT '{}',
    current_node TEXT DEFAULT '',
    is_awaiting_response INTEGER DEFAULT 0,
    last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE SET NULL
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS conversation_ai_overrides (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    override_type TEXT NOT NULL
      CHECK(override_type IN ('always_ai','always_manual','disabled','whitelist')),
    override_value TEXT DEFAULT '',
    override_by TEXT DEFAULT 'agent',
    reason TEXT DEFAULT '',
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_overrides_conversation ON conversation_ai_overrides(conversation_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS conversation_context (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    context_key TEXT NOT NULL,
    context_value TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, context_key),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Connections ────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS llm_connections (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL
      CHECK(provider IN ('gemini','openai','anthropic','azure','byollm')),
    api_key_encrypted TEXT,
    api_key_last4 TEXT DEFAULT '',
    model TEXT DEFAULT '',
    endpoint TEXT DEFAULT '',
    key_version INTEGER DEFAULT 1,
    iv TEXT DEFAULT '',
    auth_tag TEXT DEFAULT '',
    enabled INTEGER DEFAULT 1,
    config_json TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_llm_workspace ON llm_connections(workspace_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS data_connections (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    connection_type TEXT NOT NULL
      CHECK(connection_type IN ('rest_api','webhook','postgres','mysql','graphql','shopify','woocommerce','hubspot','salesforce')),
    config_json TEXT DEFAULT '{}',
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_data_connections_workspace ON data_connections(workspace_id)`); } catch (_) { /* ok */ }

  // ─── Knowledge ──────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_knowledge (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL
      CHECK(type IN ('json','text','faq','url','file','dataset')),
    content TEXT DEFAULT '',
    ref TEXT DEFAULT '',
    embedding_vector_id TEXT DEFAULT '',
    chunk_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
      CHECK(status IN ('active','indexing','error','disabled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_chatbot ON chatbot_knowledge(chatbot_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_knowledge_chunks (
    id TEXT PRIMARY KEY,
    knowledge_id TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    content_text TEXT DEFAULT '',
    embedding_vector_id TEXT DEFAULT '',
    token_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (knowledge_id) REFERENCES chatbot_knowledge(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_knowledge ON chatbot_knowledge_chunks(knowledge_id)`); } catch (_) { /* ok */ }

  // ─── Tools ──────────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_tools (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    tool_type TEXT NOT NULL
      CHECK(tool_type IN ('http_request','database_query','function','webhook','graphql')),
    config_json TEXT DEFAULT '{}',
    enabled INTEGER DEFAULT 1,
    require_confirmation INTEGER DEFAULT 0,
    cost_units INTEGER DEFAULT 2,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_tools_chatbot ON chatbot_tools(chatbot_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_datasets (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    table_name TEXT DEFAULT '',
    exposed_fields TEXT DEFAULT ''
      -- comma-separated: "name,price,stock,sku"
    searchable_fields TEXT DEFAULT ''
      -- comma-separated: "name,sku,description"
    description_fields TEXT DEFAULT ''
      -- fields to show as result description
    filters_json TEXT DEFAULT '[]',
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_datasets_workspace ON chatbot_datasets(workspace_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS dataset_relationships (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    related_dataset_id TEXT NOT NULL,
    relationship_type TEXT DEFAULT 'related'
      CHECK(relationship_type IN ('related','parent','child','reference')),
    relationship_label TEXT DEFAULT '',
    UNIQUE(dataset_id, related_dataset_id),
    FOREIGN KEY (dataset_id) REFERENCES chatbot_datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (related_dataset_id) REFERENCES chatbot_datasets(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Memory & Sessions ──────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_memories (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    memory_type TEXT NOT NULL
      CHECK(memory_type IN ('short_term','long_term','fact','preference','intent')),
    memory_key TEXT NOT NULL,
    memory_value TEXT DEFAULT '',
    confidence REAL DEFAULT 1.0,
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chatbot_id, conversation_id, memory_type, memory_key),
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_memories_conversation ON chatbot_memories(conversation_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    session_status TEXT DEFAULT 'active'
      CHECK(session_status IN ('active','paused','ended','error')),
    turn_count INTEGER DEFAULT 0,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    last_message_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_conversation ON chatbot_sessions(conversation_id)`); } catch (_) { /* ok */ }

  // ─── Logs ───────────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_tool_logs (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    tool_input_json TEXT DEFAULT '{}',
    tool_output_json TEXT DEFAULT '{}',
    status TEXT DEFAULT 'success'
      CHECK(status IN ('success','error','timeout','requires_confirmation')),
    error_message TEXT DEFAULT '',
    tokens_used INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_tool_logs_conversation ON chatbot_tool_logs(conversation_id)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_token_usage (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    model TEXT DEFAULT '',
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    cost_units INTEGER DEFAULT 10,
    period_start TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_token_usage_chatbot ON chatbot_token_usage(chatbot_id, period_start)`); } catch (_) { /* ok */ }

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_prompt_versions (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    system_prompt_text TEXT DEFAULT '',
    change_summary TEXT DEFAULT '',
    created_by TEXT DEFAULT 'system',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chatbot_id, version),
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_prompt_versions_chatbot ON chatbot_prompt_versions(chatbot_id)`); } catch (_) { /* ok */ }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_analytics (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0,
    total_cost_units INTEGER DEFAULT 0,
    ai_reply_count INTEGER DEFAULT 0,
    manual_reply_count INTEGER DEFAULT 0,
    handoff_count INTEGER DEFAULT 0,
    avg_confidence REAL DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    unique_contacts INTEGER DEFAULT 0,
    top_intents_json TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_chatbot ON chatbot_analytics(chatbot_id, period_start)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_workspace ON chatbot_analytics(workspace_id, period_start)`); } catch (_) { /* ok */ }

  // ─── Testing ────────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_test_sessions (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    test_type TEXT DEFAULT 'manual'
      CHECK(test_type IN ('manual','automated','regression')),
    messages_json TEXT DEFAULT '[]',
    tool_calls_json TEXT DEFAULT '[]',
    tokens_used INTEGER DEFAULT 0,
    cost_units_used INTEGER DEFAULT 0,
    outcome TEXT DEFAULT 'passed'
      CHECK(outcome IN ('passed','failed','error')),
    error_log TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_test_sessions_chatbot ON chatbot_test_sessions(chatbot_id)`); } catch (_) { /* ok */ }

  // ─── Versioning ─────────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_versions (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    config_snapshot_json TEXT NOT NULL DEFAULT '{}',
    is_published INTEGER DEFAULT 0,
    published_at TEXT,
    published_by TEXT DEFAULT '',
    change_summary TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chatbot_id, version),
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_chatbot_versions ON chatbot_versions(chatbot_id, version)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 9 migrations complete (chatbot platform — workflows, handoff, BYOLLM, testing, versioning)');
}