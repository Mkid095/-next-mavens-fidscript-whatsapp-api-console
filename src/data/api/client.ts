// =============================================================================
// Data Layer — API transport client (§16, P7)
// The single canonical entry point for all HTTP. Components never call fetch
// directly — they consume hooks (src/data/hooks/*). Existing src/services/* is
// migrated to re-export from here (shim), so imports keep working.
// =============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3099';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// Token + header helpers (admin OR client JWT)
// ---------------------------------------------------------------------------

export function getAdminToken(): string | null {
  return localStorage.getItem('fidscript_admin_token');
}

export function getClientToken(): string | null {
  return localStorage.getItem('fidscript_client_token');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAdminToken() || getClientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Core fetch wrapper — uniform { success, data?, error? } shape + JSON guard
// ---------------------------------------------------------------------------

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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
      return { success: false, error: `Unexpected response: ${response.status} ${text.substring(0, 100)}` };
    }
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Convenience method wrappers
export const apiGet = <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' });
export const apiPost = <T>(endpoint: string, body?: unknown) =>
  fetchApi<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T>(endpoint: string, body?: unknown) =>
  fetchApi<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' });
