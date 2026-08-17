import { useEffect, useRef } from 'react';
import type { Instance } from '../../../services/api';
import { emitDataEvent } from '../../../data';

/**
 * Always-on SSE bridge. Owns one EventSource per connected instance for the
 * lifetime of the client portal and re-broadcasts events onto `window` so any
 * mounted page can react in real time:
 *   - `sse-new-message`   → a message arrived (inbox + open conversation)
 *   - `sse-state-change`  → instance connected/disconnected (cards, pickers)
 *   - `sse-token-update`  → token balance changed (header, store)
 *
 * This hook lives at the ClientDashboard level (always mounted while logged in),
 * NOT inside WhatsAppContainers - so the stream stays alive on /client/messages
 * where it is actually needed. Connections are reopened only when the SET of
 * connected instance names changes, never on ordinary re-renders.
 */
export interface InstanceStateChange {
  state: 'connected' | 'connecting' | 'disconnected';
  phoneNumber: string | null;
}

export function useInstanceSSE(
  instances: Instance[],
  onStateChange: (name: string, change: InstanceStateChange) => void,
): void {
  const cbRef = useRef(onStateChange);
  cbRef.current = onStateChange;

  const connectedKey = instances
    .filter(i => i.status === 'connected')
    .map(i => i.name)
    .sort()
    .join('|');

  useEffect(() => {
    const token = localStorage.getItem('fidscript_client_token');
    if (!token || !connectedKey) return;
    const names = connectedKey.split('|').filter(Boolean);
    const controllers = new Map<string, EventSource>();

    names.forEach(name => {
      const es = new EventSource(`/api/sse/instance/${name}?token=${encodeURIComponent(token)}`);
      controllers.set(name, es);

      es.addEventListener('stateChange', event => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as InstanceStateChange;
          window.dispatchEvent(new CustomEvent('sse-state-change', { detail: { name, ...data } }));
          cbRef.current(name, data);
        } catch { /* malformed payload */ }
      });

      es.addEventListener('newMessage', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data) as {
            id: string; from_number: string; from_name: string; message_type: string;
            content: string; media_url: string | null; timestamp: string;
            chat_id: string; is_group: number;
          };
          // Dispatch to window for useChatMessages, emit to dataEvents for useChatList (no throttle)
          window.dispatchEvent(new CustomEvent('sse-new-message', { detail: raw }));
          emitDataEvent('message.received', {
            id: raw.id,
            chatId: raw.chat_id,
            fromNumber: raw.from_number,
            fromName: raw.from_name,
            messageType: raw.message_type,
            content: raw.content,
            mediaUrl: raw.media_url,
            timestamp: raw.timestamp,
            isGroup: raw.is_group,
          });
        } catch { /* malformed payload */ }
      });

      // Confirmed outbound message - emitted immediately after DB write (before webhook echo)
      es.addEventListener('messageSent', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data) as {
            id: string; from_number: string; from_name: string; message_type: string;
            content: string; media_url: string | null; timestamp: string;
            chat_id: string; is_group: number;
          };
          window.dispatchEvent(new CustomEvent('sse-message-sent', { detail: raw }));
          emitDataEvent('message.sent', {
            id: raw.id,
            chatId: raw.chat_id,
            fromNumber: raw.from_number,
            fromName: raw.from_name,
            messageType: raw.message_type,
            content: raw.content,
            mediaUrl: raw.media_url,
            timestamp: raw.timestamp,
            isGroup: raw.is_group,
          });
        } catch { /* malformed payload */ }
      });

      es.addEventListener('tokenUpdate', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data);
          window.dispatchEvent(new CustomEvent('sse-token-update', { detail: raw }));
        } catch { /* malformed payload */ }
      });

      // Read receipts → flip message to blue tick (inbox refreshes via the data bus)
      es.addEventListener('messageReceipt', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data) as { chat_id: string; messageId: string; status: string };
          emitDataEvent('message.read', { conversationId: null, messageId: raw.messageId, chatId: raw.chat_id });
        } catch { /* malformed payload */ }
      });

      // Presence/typing → both window event (for inline typing indicator)
      // and data bus (for any future consumer like a "typing" sidebar dot).
      es.addEventListener('presence', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data) as { chat_id: string; presence: string; from_name: string };
          window.dispatchEvent(new CustomEvent('sse-presence', { detail: { chat_id: raw.chat_id, presence: raw.presence, from_name: raw.from_name } }));
          emitDataEvent('presence', { chatId: raw.chat_id, presence: raw.presence, fromName: raw.from_name });
        } catch { /* malformed payload */ }
      });

      // AI override changed → update chat list indicators in real time
      es.addEventListener('aiOverrideChanged', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data) as { chat_id: string; mode: string };
          emitDataEvent('ai.override_changed', { chatId: raw.chat_id, mode: raw.mode });
        } catch { /* malformed payload */ }
      });
    });

    return () => {
      controllers.forEach(es => es.close());
    };
    // Reopen only when the connected set changes - not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedKey]);
}
