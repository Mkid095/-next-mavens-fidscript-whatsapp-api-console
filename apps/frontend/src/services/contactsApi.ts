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
};

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

export const clientKeysApi = {
  getAll: () => fetchApi<ClientApiKey[]>('/api/client/keys'),

  create: (name: string) =>
    fetchApi<ClientApiKey>('/api/client/keys', { method: 'POST', body: JSON.stringify({ name }) }),

  revoke: (id: string) => fetchApi<void>(`/api/client/keys/${id}`, { method: 'DELETE' }),

  regenerate: (id: string) =>
    fetchApi<{ id: string; key: string }>(`/api/client/keys/${id}/regenerate`, { method: 'POST' }),
};
