// API Log types
export interface ApiLog {
  id: string;
  instance_id: string | null;
  client_id: string | null;
  method: string;
  endpoint: string;
  request_body: string | null;
  response_status: number | null;
  response_body: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

// Audit Log types
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}

// Inbox Message types
export interface InboxMessage {
  id: string;
  instance_id: string | null;
  client_id: string | null;
  from_number: string;
  from_name: string | null;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  content: string | null;
  media_url: string | null;
  is_read: number;
  timestamp: string;
}

// API Request/Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
