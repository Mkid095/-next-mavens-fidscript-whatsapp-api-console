import type { InstanceStatus } from './entities.js';

// Instance settings
export interface InstanceSettings {
  reject_calls: boolean;
  groups_ignore: boolean;
  always_online: boolean;
  read_messages: boolean;
  sync_full_history: boolean;
}

// Webhook payload types
export interface WebhookMessagePayload {
  event: 'message';
  instance: string;
  data: {
    key: {
      id: string;
      remote: string;
      from_me: boolean;
    };
    pushName: string;
    message: {
      conversation?: string;
      imageMessage?: { url: string; caption?: string };
      audioMessage?: { url: string };
      videoMessage?: { url: string; caption?: string };
      documentMessage?: { url: string; fileName: string };
      locationMessage?: { degreesLatitude: number; degreesLongitude: number };
    };
    messageType: string;
    timestamp: number;
  };
}

export interface WebhookConnectionPayload {
  event: 'connection';
  instance: string;
  data: {
    state: InstanceStatus;
    qrcode?: string;
  };
}

export interface WebhookQrcodePayload {
  event: 'qrcode';
  instance: string;
  data: {
    code: string;
    image: string;
  };
}

// Analytics types
export interface AnalyticsData {
  total_clients: number;
  active_clients: number;
  total_instances: number;
  connected_instances: number;
  messages_today: number;
  messages_this_month: number;
  delivery_rate: number;
  daily_trends: DailyTrend[];
  top_clients: TopClient[];
  top_instances: TopInstance[];
}

export interface DailyTrend {
  date: string;
  messages_sent: number;
  messages_delivered: number;
  failed_messages: number;
}

export interface TopClient {
  client_id: string;
  client_name: string;
  total_messages: number;
  active_instances: number;
}

export interface TopInstance {
  instance_id: string;
  instance_name: string;
  client_name: string;
  total_messages: number;
  status: InstanceStatus;
}
