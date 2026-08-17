// FIDScript API Service - COMPAT SHIM
// Core transport (fetchApi, API_BASE_URL, tokens, response types) now lives in
// src/data/api/client.ts - the canonical data layer (§16). This file re-exports
// it so existing imports (`services/api`) keep working during migration. New
// code should import from `src/data` instead.

export {
  API_BASE_URL,
  fetchApi,
  getAuthHeaders,
  getAdminToken,
  getClientToken,
} from '../data/api/client.js';
export type { ApiResponse, PaginatedResponse } from '../data/api/client.js';

// ====================
// SSE HELPERS (transport-aware, retained here)
// ====================

import { API_BASE_URL as BASE, fetchApi as _fetchApi } from '../data/api/client.js';

/** Create an EventSource for real-time instance connection state updates. */
export function createInstanceSSE(instanceName: string): EventSource {
  const token = localStorage.getItem('fidscript_client_token') || localStorage.getItem('fidscript_admin_token') || '';
  const url = `${BASE}/api/sse/instance/${encodeURIComponent(instanceName)}?token=${encodeURIComponent(token)}`;
  return new EventSource(url);
}

/** Trigger the dashboard SSE to refresh stats (e.g. after sending a message) */
export async function refreshDashboard(): Promise<void> {
  const token = localStorage.getItem('fidscript_client_token') || '';
  await _fetchApi('/api/sse/dashboard/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ====================
// RE-EXPORTS (domain services + types)
// ====================

export type { InstanceStatus, Instance, ApiLog, InstanceSettings, AnalyticsData, DailyTrend, TopClient, TopInstance, TokenPackage, DailyUsage } from './types';

export { authApi } from './auth';
export { adminApi } from './admin';
export { clientsApi, plansApi } from './clients';
export type { Client, Plan, User, TokenTransaction } from './clients';
export { instancesApi } from './instances';
export { paymentsApi } from './payments';
export { uploadsApi } from './uploads';
export { versionsApi } from './versions';
export type { DeployVersion } from './versions';
export { contactsApi, clientMessagesApi, clientKeysApi, campaignsApi, groupsApi } from './contacts';
export type { Contact, ClientMessage, ClientApiKey, Campaign, CampaignRecipient, ContactGroup, ContactGroupMember } from './contacts';
// Re-exported for legacy `import { Conversation } from '../../services/api'` consumers.
export type { Conversation, ConversationStatus, ConversationPriority, ConversationMessage } from '../data/api/platform.js';
