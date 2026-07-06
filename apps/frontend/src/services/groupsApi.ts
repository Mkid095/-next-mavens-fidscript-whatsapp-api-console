import { fetchApi } from './api';

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
