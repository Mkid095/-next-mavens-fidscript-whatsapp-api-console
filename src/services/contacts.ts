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
};

export const clientMessagesApi = {
  getAll: (instanceName?: string) => {
    const url = instanceName ? `/api/client/messages?instance_name=${encodeURIComponent(instanceName)}` : '/api/client/messages';
    return fetchApi<ClientMessage[]>(url);
  },

  markRead: (id: string) =>
    fetchApi<void>(`/api/client/messages/${id}/read`, { method: 'PATCH' }),
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
    phone_numbers: string[];
  }) => fetchApi<Campaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  send: (id: string) =>
    fetchApi<{ campaign_id: string; tokens_deducted: number }>(`/api/campaigns/${id}/send`, { method: 'POST' }),

  delete: (id: string) => fetchApi<void>(`/api/campaigns/${id}`, { method: 'DELETE' }),
};

export const clientKeysApi = {
  getAll: () => fetchApi<ClientApiKey[]>('/api/client/keys'),

  create: (name: string) =>
    fetchApi<ClientApiKey>('/api/client/keys', { method: 'POST', body: JSON.stringify({ name }) }),

  revoke: (id: string) => fetchApi<void>(`/api/client/keys/${id}`, { method: 'DELETE' }),
};
