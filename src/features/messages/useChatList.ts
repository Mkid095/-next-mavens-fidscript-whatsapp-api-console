import { useCallback, useEffect, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type ChatListItem } from './messagesApi';

// Live chat list for one instance. Refreshes on SSE message events, window
// focus, and a light 30s poll so the preview + unread counts stay fresh.
export function useChatList(instanceName: string | null) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!instanceName) { setChats([]); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getChats(instanceName);
    setLoading(false);
    if (res.success && res.data) { setChats(res.data.chats); return; }
    setError(res.error || 'Failed to load chats');
  }, [instanceName]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!instanceName) return;
    const off = dataEvents.on('*', () => { void refresh(); });
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    const poll = setInterval(() => { void refresh(); }, 30000);
    return () => { off(); window.removeEventListener('focus', onFocus); clearInterval(poll); };
  }, [instanceName, refresh]);

  return { chats, loading, error, refresh };
}
