// =============================================================================
// useInbox — the message thread for a selected conversation (§19).
// Loads /api/platform/conversations/:id/messages, refreshes on realtime events.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';
import type { ConversationMessage } from '../../api/platform.js';
import { useDataEvent } from '../shared/useDataEvent.js';

interface UseInboxState {
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useInbox(conversationId: string | null): UseInboxState {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const received = useDataEvent('message.received');
  const sent = useDataEvent('message.sent');
  const read = useDataEvent('message.read');

  const refresh = useCallback(async () => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);
    const res = await platformApi.getConversationMessages(conversationId);
    if (res.success && res.data) { setMessages(res.data); setError(null); }
    else setError(res.error || 'Failed to load messages');
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh the open thread when a message event for this conversation arrives
  useEffect(() => {
    if (!received && !sent && !read) return;
    const evt = received || sent;
    if (evt?.payload.conversationId === conversationId) refresh();
    else if (read) refresh(); // read receipt → refresh to flip the blue tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [received, sent, read, conversationId]);

  return { messages, loading, error, refresh };
}
