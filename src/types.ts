// Re-export all API types from services/types.ts
export type {
  InstanceStatus,
  Instance,
  ApiLog,
  InstanceSettings,
  AnalyticsData,
  DailyTrend,
  TopClient,
  TopInstance,
  TokenPackage,
  DailyUsage,
} from './services/types';

// UI-specific types only below

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  source: string;
  message: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: string;
}

export interface InboxMessage {
  id: string;
  from_number: string;
  from_name: string;
  content: string;
  timestamp: string;
  read: boolean;
}