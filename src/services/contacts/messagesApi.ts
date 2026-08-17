// Messaging APIs - client messages, campaigns, and contact groups
import { fetchApi } from '../api';
import type { ClientMessage, Campaign, CampaignRecipient, ContactGroup, ContactGroupMember } from './contactsTypes';

export const clientMessagesApi = {
  getAll: (instanceName?: string) => {
    const url = instanceName
      ? `/api/client/messages?instance_name=${encodeURIComponent(instanceName)}`
      : '/api/client/messages';
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

  // Phase 5 Slice D - Trigger + Drip
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
