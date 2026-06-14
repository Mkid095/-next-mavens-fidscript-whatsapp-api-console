// Instances API
import { fetchApi, getAuthHeaders } from './api';
import type { Instance, InstanceSettings } from './types';

export const instancesApi = {
  create: (data: { name: string; display_name?: string; client_id?: string }) =>
    fetchApi<Instance>('/api/instance/create', { method: 'POST', body: JSON.stringify(data) }),

  clientCreate: (data: { name: string; display_name?: string }) =>
    fetchApi<Instance>('/api/instance/client-create', { method: 'POST', body: JSON.stringify(data) }),

  getCredentials: (name: string) =>
    fetchApi<{
      instance_name: string;
      instance_token: string;
      client_api_key: string;
      api_base_url: string;
      endpoints: Record<string, string>;
    }>(`/api/instance/credentials/${name}`),

  getSettings: (name: string) =>
    fetchApi<InstanceSettings>(`/api/instance/settings/${name}`),

  updateSettings: (name: string, settings: Partial<InstanceSettings>) =>
    fetchApi<InstanceSettings>(`/api/instance/settings/${name}`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  getWebhook: (name: string) =>
    fetchApi<{ webhook_url: string | null; webhook_enabled: boolean }>(
      `/api/instance/webhook/${name}`
    ),

  setWebhook: (name: string, webhook_url: string, enabled: boolean) =>
    fetchApi<{ webhook_url: string; webhook_enabled: boolean }>(
      `/api/instance/webhook/${name}`,
      { method: 'POST', body: JSON.stringify({ webhook_url, enabled }) }
    ),

  connect: (name: string) =>
    fetchApi<{ qrcode?: string; qrcode_image?: string; expires_in: number; link_code?: string }>(
      `/api/instance/connect/${name}`
    ),

  getConnectionState: (name: string) =>
    fetchApi<{ name: string; status: string; phone_number: string | null; qr_code: string | null }>(
      `/api/instance/connectionState/${name}`
    ),

  disconnect: (name: string) =>
    fetchApi<void>(`/api/instance/logout/${name}`, { method: 'DELETE' }),

  delete: (name: string) =>
    fetchApi<void>(`/api/instance/delete/${name}`, { method: 'DELETE' }),

  sendText: (name: string, to: string, message: string) =>
    fetchApi<{ messageId: string; to: string; message: string; timestamp: string }>(
      `/api/instance/sendText/${name}`,
      {
        method: 'POST',
        body: JSON.stringify({ to, message }),
      }
    ),

  sendMedia: (
    name: string,
    to: string,
    media_url: string,
    media_type: string,
    caption?: string,
    apiKey?: string
  ) =>
    fetchApi<{ messageId: string; to: string; media_url: string }>(
      `/api/instance/sendMedia/${name}`,
      {
        method: 'POST',
        headers: apiKey ? { 'X-API-Key': apiKey } : getAuthHeaders(),
        body: JSON.stringify({ to, media_url, media_type, caption }),
      }
    ),

  getClientInstances: () => fetchApi<Instance[]>('/api/instance/client-instances'),

  getClientSettings: (name: string) =>
    fetchApi<InstanceSettings>(`/api/instance/client-settings/${name}`),

  updateClientSettings: (name: string, settings: Partial<InstanceSettings>) =>
    fetchApi<InstanceSettings>(`/api/instance/client-settings/${name}`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};