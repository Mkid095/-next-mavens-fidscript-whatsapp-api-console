// =============================================================================
// Connector interface — every connector is an event source + action target.
// Adding a connector = a folder under integrations/connectors/<name>/.
// =============================================================================

export interface ConnectorCredentials {
  // Connector-specific credentials (opaque to the platform)
  [key: string]: unknown;
}

export interface Connector {
  /** Unique connector name (e.g. 'shopify', 'woocommerce') */
  name: string;
  /** Human-readable label */
  label: string;

  /** Connect a workspace — store credentials, establish connection */
  connect(workspaceId: string, credentials: ConnectorCredentials): Promise<void>;

  /** Sync: pull external events and publish into the bus */
  sync(integrationId: string): Promise<void>;

  /** Handle an inbound webhook from this connector */
  handleWebhook(integrationId: string, payload: Record<string, unknown>): Promise<void>;

  /** Expose actions through internal services only (never call third parties directly) */
  actions: {
    [actionName: string]: (ctx: { workspaceId: string; integrationId: string }, args: unknown) => Promise<unknown>;
  };
}
