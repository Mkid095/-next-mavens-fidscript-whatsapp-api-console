// =============================================================================
// useConversations — conversation list with filters + realtime refresh (§9).
// Updates (assign/priority/status) flow through platformApi.updateConversation.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';
import type { Conversation, ConversationStatus, ConversationPriority } from '../../api/platform.js';
import { useDataEvent } from '../shared/useDataEvent.js';

export interface ConversationFilters {
  status?: ConversationStatus;
  priority?: ConversationPriority;
  assignee?: string;
  q?: string;
}

interface UseConversationsState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (id: string, body: Parameters<typeof platformApi.updateConversation>[1]) => Promise<boolean>;
}

export function useConversations(filters?: ConversationFilters): UseConversationsState {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createdEvent = useDataEvent('conversation.created');
  const assignedEvent = useDataEvent('conversation.assigned');
  const statusEvent = useDataEvent('conversation.status_changed');
  const msgEvent = useDataEvent('message.received');

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await platformApi.listConversations(filters);
    if (res.success && res.data) setConversations(res.data);
    else setError(res.error || 'Failed to load conversations');
    setLoading(false);
  }, [filters?.status, filters?.priority, filters?.assignee, filters?.q]);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-fetch on any conversation/message lifecycle event
  useEffect(() => {
    if (createdEvent || assignedEvent || statusEvent || msgEvent) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdEvent, assignedEvent, statusEvent, msgEvent]);

  const update = useCallback(async (id: string, body: Partial<{ status: ConversationStatus; priority: ConversationPriority; assignee_type: 'user' | 'team' | 'unassigned'; assignee_id: string | null }>) => {
    const res = await platformApi.updateConversation(id, body);
    if (res.success) { refresh(); return true; }
    return false;
  }, [refresh]);

  return { conversations, loading, error, refresh, update };
}
