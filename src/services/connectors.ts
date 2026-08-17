// Connectors API - /api/platform/connectors
import { apiGet, apiPost, apiDelete } from '../data/api/client.js';

export interface ConnectorTrigger {
  event: string;
  label: string;
  description: string;
}

export interface ConnectorAction {
  name: string;
  label: string;
  description: string;
  parametersSchema: string;
}

export interface ConnectorSummary {
  id: string;
  slug: string;
  authType: string;
  triggers: ConnectorTrigger[];
  actions: ConnectorAction[];
  installed: boolean;
  docsUrl?: string;
  installUrl?: string;
}

export interface ConnectorDetail extends ConnectorSummary {
  tools: { name: string; description: string }[];
  credentialsStored: boolean;
  expiresAt: string | null;
}

export const connectorsApi = {
  /** List all connectors with install status */
  list: () => apiGet<ConnectorSummary[]>('/api/platform/connectors'),

  /** Get connector detail + credential status */
  get: (slug: string) => apiGet<ConnectorDetail>(`/api/platform/connectors/${slug}`),

  /** Store credentials (OAuth token or API key) */
  saveCredentials: (
    slug: string,
    data: { access_token: string; refresh_token?: string; expires_in?: number; shop?: string },
  ) => apiPost<{ id: string }>(`/api/platform/connectors/${slug}/credentials`, data),

  /** Revoke credentials */
  revoke: (slug: string) => apiDelete<void>(`/api/platform/connectors/${slug}/credentials`),
};
