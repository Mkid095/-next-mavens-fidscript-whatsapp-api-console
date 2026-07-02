// Contacts API + Client Messages API + Client Keys API
import { fetchApi } from './api';

export interface Contact {
  id: string;
  phone: string;
  name: string;
  tags: string;
  created_at: string;
}

export interface ClientMessage {
  id: string;
  from_number: string;
  from_name: string;
  message_type: string;
  content: string;
  media_url: string | null;
  is_read: number;
  timestamp: string;
  instance_name: string;
  direction?: 'incoming' | 'outgoing';
  chat_id?: string;
  is_group?: number;
}

export interface ClientApiKey {
  id: string;
  name: string;
  key_prefix?: string;
  key?: string;
  status: string;
  created_at: string;
  last_used: string | null;
}

export const contactsApi = {
  getAll: () => fetchApi<Contact[]>('/api/contacts'),

  importBatch: (contacts: { phone: string; name: string; tags?: string }[]) =>
    fetchApi<{ count: number }>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    }),

  delete: (id: string) => fetchApi<void>(`/api/contacts/${id}`, { method: 'DELETE' }),

  update: (id: string, data: { name?: string; phone?: string; tags?: string }) =>
    fetchApi<void>(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ─── Google OAuth ───────────────────────────────────────────────────────────

  googleAuthUrl: () => fetchApi<{ url: string }>('/api/contacts/google/auth-url'),

  googleStatus: () => fetchApi<{
    linked: boolean;
    name?: string;
    email?: string;
    picture?: string;
  }>('/api/contacts/google/status'),

  googleImport: () =>
    fetchApi<{ imported: number; errors: number; total: number }>(
      '/api/contacts/google/import',
      { method: 'POST' }
    ),

  googleUnlink: () =>
    fetchApi<void>('/api/contacts/google/link', { method: 'DELETE' }),
};

/**
 * Opens Google OAuth. Tries popup first (desktop), falls back to redirect (mobile).
 * Popup approach: polls popup.location for google_linked=1 or google_error=...
 * Redirect approach: sets a session flag then navigates, callback lands on /client/contacts.
 */
export function openGoogleOAuthPopup(): Promise<void> {
  return new Promise((resolve, reject) => {
    contactsApi.googleAuthUrl().then((res) => {
      console.debug('[GoogleOAuth] auth-url response:', res);
      if (!res.success) {
        reject(new Error(res.error || 'Failed to get Google auth URL'));
        return;
      }
      if (!res.data?.url) {
        reject(new Error('Server returned an empty auth URL — try again'));
        return;
      }

      const authUrl = res.data.url;

      // Try popup first
      const popup = window.open(authUrl, 'google_oauth', 'width=600,height=700,scrollbars=yes');
      if (popup) {
        // Poll for OAuth callback result via popup URL
        const poll = setInterval(() => {
          try {
            const url = popup.location.href;
            if (url.includes('google_linked=1')) {
              clearInterval(poll);
              popup.close();
              resolve();
            } else if (url.includes('google_error=')) {
              clearInterval(poll);
              const errMatch = url.match(/google_error=([^&]+)/);
              popup.close();
              reject(new Error(decodeURIComponent(errMatch?.[1] || 'Google OAuth failed')));
            }
          } catch {
            // Cross-origin — can't read URL yet, keep polling
          }
        }, 500);

        // Reject if popup is closed without completing sign-in
        const closeCheck = setInterval(() => {
          if (popup.closed) {
            clearInterval(poll);
            clearInterval(closeCheck);
            reject(new Error('Popup closed without completing Google sign-in'));
          }
        }, 1000);
      } else {
        // Popup blocked — fall back to redirect flow
        console.warn('[GoogleOAuth] popup blocked, falling back to redirect');
        // Store a flag so we know the redirect is from OAuth
        sessionStorage.setItem('google_oauth_pending', '1');
        window.location.href = authUrl;
      }
    }).catch(reject);
  });
}

export const clientMessagesApi = {
  getAll: (instanceName?: string) => {
    const url = instanceName ? `/api/client/messages?instance_name=${encodeURIComponent(instanceName)}` : '/api/client/messages';
    return fetchApi<ClientMessage[]>(url);
  },

  markRead: (id: string) =>
    fetchApi<void>(`/api/client/messages/${id}/read`, { method: 'PATCH' }),

  getDashboardStats: () =>
    fetchApi<{
      messagesToday: number;
      dailyVolume: { date: string; messages_sent: number; messages_delivered: number }[];
      recentMessages: ClientMessage[];
    }>('/api/client/messages/dashboard-stats'),
};

export interface Campaign {
  id: string;
  name: string;
  instance_name: string;
  message_type: string;
  content: string;
  media_url: string | null;
  caption: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  group_id: string | null;
  group_name?: string;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  phone: string;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

export const campaignsApi = {
  getAll: () => fetchApi<Campaign[]>('/api/campaigns'),

  getOne: (id: string) =>
    fetchApi<{ campaign: Campaign; recipients: CampaignRecipient[] }>(`/api/campaigns/${id}`),

  create: (data: {
    name: string;
    instance_name: string;
    message_type?: string;
    content?: string;
    media_url?: string;
    caption?: string;
    scheduled_at?: string;
    phone_numbers?: string[];
    group_id?: string;
  }) => fetchApi<Campaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  send: (id: string) =>
    fetchApi<{ campaign_id: string; tokens_deducted: number }>(`/api/campaigns/${id}/send`, { method: 'POST' }),

  duplicate: (id: string) =>
    fetchApi<Campaign>(`/api/campaigns/${id}/duplicate`, { method: 'POST' }),

  delete: (id: string) => fetchApi<void>(`/api/campaigns/${id}`, { method: 'DELETE' }),

  // Phase 5 Slice D — Trigger + Drip
  listSteps: (campaignId: string) => fetchApi<unknown[]>(`/api/campaigns/${campaignId}/steps`),
  createStep: (campaignId: string, body: { step_order?: number; delay_seconds?: number; action_type: string; action_config?: unknown }) =>
    fetchApi<unknown>(`/api/campaigns/${campaignId}/steps`, { method: 'POST', body: JSON.stringify(body) }),
  updateStep: (campaignId: string, stepId: string, body: Partial<{ step_order: number; delay_seconds: number; action_type: string; action_config: unknown }>) =>
    fetchApi<void>(`/api/campaigns/${campaignId}/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteStep: (campaignId: string, stepId: string) =>
    fetchApi<void>(`/api/campaigns/${campaignId}/steps/${stepId}`, { method: 'DELETE' }),

  listTriggers: (campaignId: string) => fetchApi<unknown[]>(`/api/campaigns/${campaignId}/triggers`),
  createTrigger: (campaignId: string, body: { event: string; filter_json?: unknown }) =>
    fetchApi<unknown>(`/api/campaigns/${campaignId}/triggers`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTrigger: (campaignId: string, triggerId: string) =>
    fetchApi<void>(`/api/campaigns/${campaignId}/triggers/${triggerId}`, { method: 'DELETE' }),

  enroll: (campaignId: string, customerId: string) =>
    fetchApi<{ enrollmentId: string }>(`/api/campaigns/${campaignId}/enroll`, { method: 'POST', body: JSON.stringify({ customer_id: customerId }) }),
  listEnrollments: (campaignId: string) => fetchApi<unknown[]>(`/api/campaigns/${campaignId}/enrollments`),
};

export interface ContactGroup {
  id: string;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
}

export interface ContactGroupMember {
  id: string;
  phone: string;
  name: string;
  tags: string;
  added_at: string;
}

export const groupsApi = {
  getAll: () => fetchApi<ContactGroup[]>('/api/groups'),

  getOne: (id: string) =>
    fetchApi<{ group: ContactGroup; members: ContactGroupMember[] }>(`/api/groups/${id}`),

  create: (name: string, description?: string) =>
    fetchApi<ContactGroup>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, name: string, description?: string) =>
    fetchApi<void>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    }),

  delete: (id: string) => fetchApi<void>(`/api/groups/${id}`, { method: 'DELETE' }),

  addContacts: (id: string, contact_ids: string[]) =>
    fetchApi<{ count: number }>(`/api/groups/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify({ contact_ids }),
    }),

  removeContact: (id: string, contactId: string) =>
    fetchApi<void>(`/api/groups/${id}/contacts/${contactId}`, { method: 'DELETE' }),
};

export const clientKeysApi = {
  getAll: () => fetchApi<ClientApiKey[]>('/api/client/keys'),

  create: (name: string) =>
    fetchApi<ClientApiKey>('/api/client/keys', { method: 'POST', body: JSON.stringify({ name }) }),

  revoke: (id: string) => fetchApi<void>(`/api/client/keys/${id}`, { method: 'DELETE' }),

  regenerate: (id: string) =>
    fetchApi<{ id: string; key: string }>(`/api/client/keys/${id}/regenerate`, { method: 'POST' }),
};
