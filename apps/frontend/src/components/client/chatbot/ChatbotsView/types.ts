import type { Instance } from '../../../../services/api';

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  instance_id: string;
  enabled: number;
  priority: number;
  trigger_count?: number;
  contact_count?: number;
  created_at: string;
}

export interface ChatbotsViewProps {
  clientToken: string;
  instances: Instance[];
}
