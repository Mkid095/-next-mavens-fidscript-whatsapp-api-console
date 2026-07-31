import { useCallback, useState } from 'react';
import type { Instance } from '../../../services/api';

export type MessageTab = 'contacts' | 'groups' | 'outbox';

export function useMessageTabs(instances: Instance[]) {
  const [activeTab, setActiveTab] = useState<MessageTab>('contacts');

  const switchInstance = useCallback((next: Instance | null) => {
    // Called by parent to switch instance
    void next;
  }, []);

  return { activeTab, setActiveTab, switchInstance };
}
