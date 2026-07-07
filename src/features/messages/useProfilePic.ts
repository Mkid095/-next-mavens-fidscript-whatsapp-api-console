import { useEffect, useState } from 'react';
import { messagesApi } from './messagesApi';

// Module-level cache + concurrency cap so the initial profile-pic burst on
// chat-list load doesn't fire N concurrent gateway calls when N chats are
// visible. Max 3 in flight; the rest queue and start as slots free up.
type CacheValue = string | null | undefined; // undefined = loading, null = known-null
const cache = new Map<string, CacheValue>();
const inflight = new Set<string>();
const queue: string[] = [];
const MAX_CONCURRENT = 3;
const listeners = new Map<string, Set<(v: CacheValue) => void>>();

function notify(key: string, v: CacheValue) {
  cache.set(key, v);
  const set = listeners.get(key);
  if (set) { for (const fn of set) fn(v); listeners.delete(key); }
  inflight.delete(key);
  pump();
}

function pump() {
  while (inflight.size < MAX_CONCURRENT && queue.length > 0) {
    const key = queue.shift()!;
    if (inflight.has(key) || cache.has(key)) continue;
    inflight.add(key);
    const [instanceName, lookupKey] = key.split('::');
    // Strip the i:/g: prefix before passing to the API (they're only for cache disambiguation)
    const apiNumber = lookupKey.replace(/^(i:|g:)/, '');
    messagesApi.getProfilePic(instanceName, apiNumber).then((res) => {
      notify(key, res.success && res.data ? res.data.url : null);
    }).catch(() => notify(key, null));
  }
}

// lookupKey: full JID for groups (123456-789@g.us), phone digits for 1:1 (254712345678).
// The key doubles as the API param — getProfilePic passes it directly to Evolution API.
export function useProfilePic(instanceName: string | null, lookupKey: string | null): CacheValue {
  const key = instanceName && lookupKey ? `${instanceName}::${lookupKey}` : '';
  const cached = key ? cache.get(key) : undefined;
  const [url, setUrl] = useState<CacheValue>(cached);

  useEffect(() => {
    if (!key) { setUrl(undefined); return; }
    if (cache.has(key)) { setUrl(cache.get(key)); return; }
    const set = listeners.get(key) ?? new Set();
    set.add(setUrl);
    listeners.set(key, set);
    if (!inflight.has(key)) queue.push(key);
    pump();
    return () => {
      const s = listeners.get(key); if (s) { s.delete(setUrl); if (s.size === 0) listeners.delete(key); }
    };
  }, [key]);

  return url;
}