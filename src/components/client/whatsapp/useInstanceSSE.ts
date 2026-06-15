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
 * NOT inside WhatsAppContainers — so the stream stays alive on /client/messages
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
          const raw = JSON.parse((event as MessageEvent).data);
          window.dispatchEvent(new CustomEvent('sse-new-message', { detail: raw }));
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
          const raw = JSON.parse((event as MessageEvent).data) as { chatId: string; messageId: string; status: string };
          emitDataEvent('message.read', { conversationId: null, messageId: raw.messageId, chatId: raw.chatId });
        } catch { /* malformed payload */ }
      });

      // Presence/typing → both window event (for inline typing indicator)
      // and data bus (for any future consumer like a "typing" sidebar dot).
      es.addEventListener('presence', event => {
        try {
          const raw = JSON.parse((event as MessageEvent).data) as { chatId: string; presence: string; fromName: string | null };
          window.dispatchEvent(new CustomEvent('sse-presence', { detail: raw }));
          emitDataEvent('presence', { chatId: raw.chatId, presence: raw.presence, fromName: raw.fromName });
        } catch { /* malformed payload */ }
      });
    });

    return () => {
      controllers.forEach(es => es.close());
    };
    // Reopen only when the connected set changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedKey]);
}
