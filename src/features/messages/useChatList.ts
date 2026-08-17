import {useCallback, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {dataEvents} from '../../data';
import {
  chatListKey,
  invalidateChatList,
  optimisticallyClearUnread,
  optimisticallyIncrementUnread,
} from './cacheUtils';
import {messagesApi, type ChatListItem} from './messagesApi';

export {chatListKey, invalidateChatList};

export function useChatList(
  instanceName: string | null,
  activeJid: string | null = null,
  filter?: 'contacts' | 'groups' | 'outbox',
) {
  const {data, isLoading, error, refetch} = useQuery({
    queryKey: chatListKey(instanceName ?? '', filter),
    queryFn: async () => {
      if (!instanceName) return {chats: [] as ChatListItem[]};
      const res = await messagesApi.getChats(instanceName, filter);
      if (res.success && res.data) return res.data;
      throw new Error(res.error ?? 'Failed to load chats');
    },
    enabled: !!instanceName,
    staleTime: 60_000,
  });

  // Subscribe to SSE real-time events - update cache optimistically + invalidate
  // in background so the cache stays accurate without blocking the UI.
  useEffect(() => {
    if (!instanceName) return;

    const offReceived = dataEvents.on('message.received', (e) => {
      const payload = e.payload as {chatId?: string};
      if (!payload.chatId) return;
      // Don't optimistically bump the unread counter for the chat we have open -
      // the thread handles incoming messages directly.
      if (payload.chatId === activeJid) return;
      optimisticallyIncrementUnread(instanceName, payload.chatId, filter);
    });

    const offRead = dataEvents.on('message.read', (e) => {
      const {chatId} = e.payload as {chatId?: string};
      if (!chatId) return;
      optimisticallyClearUnread(instanceName, chatId, filter);
    });

    // Wildcard: something significant changed - background refetch.
    const offWild = dataEvents.on('*', () => {
      invalidateChatList(instanceName, filter);
    });

    return () => {
      offReceived();
      offRead();
      offWild();
    };
  }, [instanceName, activeJid, filter]);

  const refresh = useCallback(() => refetch(), [refetch]);

  return {
    chats: data?.chats ?? ([] as ChatListItem[]),
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refresh,
  };
}
