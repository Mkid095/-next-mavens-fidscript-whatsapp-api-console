/**
 * connectors/types.ts — shared types for the connector ecosystem.
 *
 * A "connector" is a named integration with an external service (Shopify, WooCommerce, etc.).
 * Each connector exposes:
 *   - auth:  OAuth2 or API-key based authentication config
 *   - triggers: events from the external service that can start automations
 *   - actions: operations the AI can perform on behalf of the workspace
 *   - tools: tool definitions auto-registered with the tool calling engine
 *
 * Connectors live in modules/connectors/<name>/ and register themselves via the ConnectorRegistry.
 */
export type AuthType = 'api_key' | 'oauth2' | 'basic' | 'none';

export interface ConnectorAuth {
  type: AuthType;
  // For api_key: store encrypted key in credentials table
  // For oauth2: store { access_token, refresh_token, expires_at } per workspace
  // For basic: username + password
}

export interface ConnectorTriggerDef {
  /** e.g. 'shopify.order.created' */
  event: string;
  /** Human label */
  label: string;
  /** Human description */
  description: string;
  /** JSON Schema for the trigger payload */
  payloadSchema?: string;
}

export interface ConnectorActionDef {
  /** e.g. 'shopify.get_product' */
  name: string;
  /** Human label */
  label: string;
  /** Human description */
  description: string;
  /** JSON Schema for action parameters */
  parametersSchema: string;
  /** Whether this action requires confirmation before execution */
  requiresConfirmation?: boolean;
}

export interface ConnectorToolDef {
  name: string;
  description: string;
  parameters_json: string;
}

export interface ConnectorConfig {
  id: string;
  /** e.g. 'shopify', 'woocommerce' */
  slug: string;
  authType: AuthType;
  triggers: ConnectorTriggerDef[];
  actions: ConnectorActionDef[];
  tools: ConnectorToolDef[];
  /** Install/welcome URL for OAuth flows */
  installUrl?: string;
  /** Docs URL shown in the UI */
  docsUrl?: string;
  /** Whether multiple workspaces can share one credentials set */
  sharedCredentials?: boolean;
}

// ─── Credentials storage ───────────────────────────────────────────────────────────

export interface StoredCredential {
  id: string;
  workspaceId: string;
  connectorId: string;
  encryptedToken: string; // AES-256-GCM encrypted
  iv: string;
  authTag: string;
  expiresAt?: string;
}

// ─── Tool execution context ────────────────────────────────────────────────────

export interface ConnectorToolContext {
  workspaceId: string;
  connectorId: string;
  action: string;
  parameters: Record<string, unknown>;
}
