/**
 * Message cache utilities — shared between the chat hooks and the container
 * delete flow so instance eviction clears both the React Query cache and any
 * legacy localStorage entries.
 */
import {queryClient} from '../../queryClient';
import type {MirrorMessage} from './messagesApi';

export const threadKey = (instanceName: string, jid: string) =>
  ['thread', instanceName, jid] as const;

export const chatListKey = (instanceName: string, filter?: 'contacts' | 'groups' | 'outbox') =>
  ['chats', instanceName, filter ?? 'all'] as const;

/**
 * Evict all cached data for a given instance — called when the instance is
 * deleted so no stale state bleeds into future sessions.
 */
export function evictInstanceCache(instanceName: string) {
  // Evict all filter variants of the chat list
  queryClient.removeQueries({queryKey: ['chats', instanceName, 'all']});
  queryClient.removeQueries({queryKey: ['chats', instanceName, 'contacts']});
  queryClient.removeQueries({queryKey: ['chats', instanceName, 'groups']});
  queryClient.removeQueries({queryKey: ['chats', instanceName, 'outbox']});
  // Evict all thread queries for this instance
  queryClient.removeQueries({queryKey: ['thread', instanceName]});
  // Purge the legacy localStorage cache (covers all instances in v1 format)
  try {
    localStorage.removeItem('wap_chat_cache_v1');
  } catch {
    // ignore
  }
  // Purge any per-instance localStorage cache
  try {
    localStorage.removeItem(`wap_chat_cache_${instanceName}`);
  } catch {
    // ignore
  }
}

/**
 * Prepend an incoming message to the thread cache (real-time SSE).
 */
export function prependIncomingMessage(
  instanceName: string,
  jid: string,
  msg: MirrorMessage,
) {
  queryClient.setQueryData<{messages: MirrorMessage[]}>(
    threadKey(instanceName, jid),
    (old) => {
      if (!old) return old;
      if (old.messages.some((m) => m.id === msg.id)) return old;
      return {messages: [...old.messages, msg]};
    },
  );
}

/**
 * Replace an optimistic outgoing message with the server-confirmed version.
 */
export function confirmOutgoingMessage(
  instanceName: string,
  jid: string,
  senderJid: string,
  serverMsg: MirrorMessage,
) {
  queryClient.setQueryData<{messages: MirrorMessage[]}>(
    threadKey(instanceName, jid),
    (old) => {
      if (!old) return old;
      const filtered = old.messages.filter(
        (m) =>
          !(
            m.id.startsWith('optimistic:') &&
            m.senderJid === senderJid &&
            m.direction === 'outgoing'
          ),
      );
      if (filtered.some((m) => m.id === serverMsg.id)) return old;
      return {messages: [...filtered, serverMsg]};
    },
  );
}

/**
 * Append a message to a thread's cache instantly — used by the optimistic
 * outgoing bubble before the server confirms it.
 */
export function appendToThread(
  instanceName: string,
  jid: string,
  msg: MirrorMessage,
) {
  queryClient.setQueryData<{messages: MirrorMessage[]}>(
    threadKey(instanceName, jid),
    (old) => {
      if (!old) return old;
      if (old.messages.some((m) => m.id === msg.id)) return old;
      return {messages: [...old.messages, msg]};
    },
  );
}

/**
 * Optimistically increment the unread count for a single chat in the chat list.
 */
export function optimisticallyIncrementUnread(
  instanceName: string,
  chatId: string,
  filter?: 'contacts' | 'groups' | 'outbox',
) {
  queryClient.setQueryData<{chats: {jid: string; unread: number}[]}>(
    chatListKey(instanceName, filter),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        chats: old.chats.map((c) =>
          c.jid === chatId ? {...c, unread: c.unread + 1} : c,
        ),
      };
    },
  );
}

/**
 * Zero-out the unread count for a chat in the chat list cache.
 */
export function optimisticallyClearUnread(instanceName: string, chatId: string, filter?: 'contacts' | 'groups' | 'outbox') {
  queryClient.setQueryData<{chats: {jid: string; unread: number}[]}>(
    chatListKey(instanceName, filter),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        chats: old.chats.map((c) =>
          c.jid === chatId ? {...c, unread: 0} : c,
        ),
      };
    },
  );
}

/**
 * Invalidate the chat list for an instance — call from SSE handlers when a
 * real-time event indicates the chat list may have changed.
 */
export function invalidateChatList(instanceName: string, filter?: 'contacts' | 'groups' | 'outbox') {
  queryClient.invalidateQueries({queryKey: chatListKey(instanceName, filter)});
}

/**
 * Invalidate a specific thread so the next access refetches from the network.
 */
export function invalidateThread(instanceName: string, jid: string) {
  queryClient.invalidateQueries({queryKey: threadKey(instanceName, jid)});
}
