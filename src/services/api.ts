// FIDScript API Service
// Core fetch utility + re-exports for backward compatibility

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3099';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getAdminToken(): string | null {
  return localStorage.getItem('fidscript_admin_token');
}

function getClientToken(): string | null {
  return localStorage.getItem('fidscript_client_token');
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken() || getClientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      return {
        success: false,
        error: `Unexpected response: ${response.status} ${text.substring(0, 100)}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ====================
// SSE HELPERS
// ====================

/**
 * Create an EventSource for real-time instance connection state updates.
 * The SSE endpoint is unauthenticated relative to the EventSource API
 * (it uses the same client JWT from localStorage that the rest of the app uses).
 */
export function createInstanceSSE(instanceName: string): EventSource {
  const token = localStorage.getItem('fidscript_client_token') || localStorage.getItem('fidscript_admin_token') || '';
  const url = `${API_BASE_URL}/api/sse/instance/${encodeURIComponent(instanceName)}?token=${encodeURIComponent(token)}`;
  return new EventSource(url);
}

// ====================
// RE-EXPORTS
// ====================

export { API_BASE_URL, fetchApi, getAuthHeaders };
export type { ApiResponse, PaginatedResponse };

// Types
export type { InstanceStatus, Instance, ApiLog, InstanceSettings, AnalyticsData, DailyTrend, TopClient, TopInstance, TokenPackage, DailyUsage } from './types';

// Service APIs
export { authApi } from './auth';
export { adminApi } from './admin';
export { clientsApi, plansApi } from './clients';
export type { Client, Plan, User, TokenTransaction } from './clients';
export { instancesApi } from './instances';
export { paymentsApi } from './payments';
export { uploadsApi } from './uploads';
export { contactsApi, clientMessagesApi, clientKeysApi, campaignsApi, groupsApi } from './contacts';
export type { Contact, ClientMessage, ClientApiKey, Campaign, CampaignRecipient, ContactGroup, ContactGroupMember } from './contacts';
