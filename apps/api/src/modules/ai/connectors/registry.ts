/**
 * connectors/registry.ts — singleton registry for all registered connectors.
 *
 * Each connector module calls ConnectorRegistry.register(connectorDef) at module load time
 * so the AI tool runner and REST API can enumerate available integrations without
 * importing every connector directly.
 */
import type { ConnectorConfig } from './types.js';

const _registry = new Map<string, ConnectorConfig>();

export const ConnectorRegistry = {
  register(config: ConnectorConfig): void {
    _registry.set(config.slug, config);
  },

  get(slug: string): ConnectorConfig | undefined {
    return _registry.get(slug);
  },

  all(): ConnectorConfig[] {
    return Array.from(_registry.values());
  },

  slugs(): string[] {
    return Array.from(_registry.keys());
  },
};
