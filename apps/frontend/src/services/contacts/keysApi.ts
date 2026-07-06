// Client API keys
import { fetchApi } from '../api';
import type { ClientApiKey } from './contactsTypes';

export const clientKeysApi = {
  getAll: () => fetchApi<ClientApiKey[]>('/api/client/keys'),

  create: (name: string) =>
    fetchApi<ClientApiKey>('/api/client/keys', { method: 'POST', body: JSON.stringify({ name }) }),

  revoke: (id: string) => fetchApi<void>(`/api/client/keys/${id}`, { method: 'DELETE' }),

  regenerate: (id: string) =>
    fetchApi<{ id: string; key: string }>(`/api/client/keys/${id}/regenerate`, { method: 'POST' }),
};
