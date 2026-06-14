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
  getAll: () => fetchApi<ClientMessage[]>('/api/client/messages'),

  markRead: (id: string) =>
    fetchApi<void>(`/api/client/messages/${id}/read`, { method: 'PATCH' }),
};

export const clientKeysApi = {
  getAll: () => fetchApi<ClientApiKey[]>('/api/client/keys'),

  create: (name: string) =>
    fetchApi<ClientApiKey>('/api/client/keys', { method: 'POST', body: JSON.stringify({ name }) }),

  revoke: (id: string) => fetchApi<void>(`/api/client/keys/${id}`, { method: 'DELETE' }),
};
