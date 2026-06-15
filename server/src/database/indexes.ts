import type { Database } from 'sql.js';

export function createIndexes(db: Database): void {
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_client ON instances(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_timestamp ON inbox_messages(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_token_transactions_client ON token_transactions(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payhero_reference)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email, created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON idempotency_keys(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at)`);

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
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_conv ON inbox_messages(conversation_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_customer ON inbox_messages(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_ws ON inbox_messages(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_ws ON domain_events(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_customer ON domain_events(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_conv ON domain_events(conversation_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON audit_logs(workspace_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_search_index_ws ON search_index(workspace_id)`);
}
