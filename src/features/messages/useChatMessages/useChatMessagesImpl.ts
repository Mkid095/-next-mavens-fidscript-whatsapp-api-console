import {useCallback, useEffect, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {dataEvents} from '../../../data';
import {
  appendToThread,
  confirmOutgoingMessage,
  evictInstanceCache,
  invalidateThread,
  prependIncomingMessage,
  threadKey,
} from '../cacheUtils';
import {messagesApi, type MirrorMessage} from '../messagesApi';

export {threadKey, evictInstanceCache, appendToThread, invalidateThread};

const MAX_MESSAGES_PER_CHAT = 200;

type IncomingPayload = {
  id?: string;
  chatId?: string;
  fromNumber?: string;
  fromName?: string;
  messageType?: string;
  content?: string;
  mediaUrl?: string | null;
  timestamp?: string;
  isGroup?: number;
};
type SentPayload = {
  id?: string;
  chatId?: string;
  fromNumber?: string;
  fromName?: string;
  messageType?: string;
  content?: string;
  mediaUrl?: string | null;
  timestamp?: string;
  isGroup?: number;
};

export function useChatMessages(instanceName: string | null, jid: string | null) {
  const {data, isLoading, error, refetch} = useQuery({
    queryKey: threadKey(instanceName ?? '', jid ?? ''),
    queryFn: async () => {
      if (!instanceName || !jid) return {messages: [] as MirrorMessage[]};
      const res = await messagesApi.getThread(instanceName, jid);
      if (res.success && res.data) return res.data;
      throw new Error(res.error ?? 'Failed to load messages');
    },
    enabled: !!(instanceName && jid),
    staleTime: 5 * 60_000,
  });

  // Track the previous jid to detect chat switches
  const prevJidRef = useRef<string | null>(null);

  // Guard SSE appends - only apply real-time events to the currently open chat
  const activeJidRef = useRef<string | null>(null);
  useEffect(() => {
    activeJidRef.current = jid;
    prevJidRef.current = jid;
  }, [jid]);

  // Real-time message append - only for the open conversation
  useEffect(() => {
    if (!instanceName || !jid) return;

    const offReceived = dataEvents.on('message.received', (event) => {
      if (activeJidRef.current !== jid) return;
      const payload = event.payload as IncomingPayload;
      if (payload.chatId !== jid) return;
      const msg: MirrorMessage = {
        id: payload.id || `sse_${Date.now()}`,
        direction: 'incoming',
        type: payload.messageType || 'text',
        content: payload.content || '',
        mediaUrl: payload.mediaUrl || null,
        mediaMimetype: null,
        senderName: payload.fromName || null,
        senderJid: payload.fromNumber || null,
        timestamp: payload.timestamp
          ? new Date(payload.timestamp).getTime()
          : Date.now(),
      };
      prependIncomingMessage(instanceName, jid, msg);
    });

    const offSent = dataEvents.on('message.sent', (event) => {
      if (activeJidRef.current !== jid) return;
      const payload = event.payload as SentPayload;
      if (payload.chatId !== jid) return;
      const serverMsg: MirrorMessage = {
        id: payload.id || '',
        direction: 'outgoing',
        type: payload.messageType || 'text',
        content: payload.content || '',
        mediaUrl: payload.mediaUrl || null,
        mediaMimetype: null,
        senderName: null,
        senderJid: payload.fromNumber || null,
        timestamp: payload.timestamp
          ? new Date(payload.timestamp).getTime()
          : Date.now(),
      };
      confirmOutgoingMessage(instanceName, jid, serverMsg.senderJid ?? '', serverMsg);
    });

    return () => {
      offReceived();
      offSent();
    };
  }, [instanceName, jid]);

  // Wildcard events: invalidate the current thread to trigger a background refetch
  useEffect(() => {
    if (!instanceName || !jid) return;
    const off = dataEvents.on('*', () => {
      invalidateThread(instanceName, jid);
    });
    return off;
  }, [instanceName, jid]);

  const optimisticAppend = useCallback(
    (msg: MirrorMessage) => {
      if (!instanceName || !jid) return;
      appendToThread(instanceName, jid, msg);
    },
    [instanceName, jid],
  );

  return {
    messages: data?.messages?.slice(0, MAX_MESSAGES_PER_CHAT) ?? ([] as MirrorMessage[]),
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    optimisticAppend,
  };
}
