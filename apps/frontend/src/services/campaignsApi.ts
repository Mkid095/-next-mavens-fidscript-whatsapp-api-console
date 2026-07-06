import { fetchApi } from './api';

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
