// Shared types for contacts, messages, campaigns, groups, and keys APIs
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
