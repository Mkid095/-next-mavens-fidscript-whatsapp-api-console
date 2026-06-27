import { useEffect, useState } from 'react';
import { messagesApi } from './messagesApi';

// Module-level cache + concurrency cap so the initial profile-pic burst on
// chat-list load doesn't fire N concurrent Evolution calls when N chats are
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
    const [instanceName, number] = key.split('::');
    messagesApi.getProfilePic(instanceName, number).then((res) => {
      notify(key, res.success && res.data ? res.data.url : null);
    }).catch(() => notify(key, null));
  }
}

export function useProfilePic(instanceName: string | null, number: string | null): CacheValue {
  const key = instanceName && number ? `${instanceName}::${number}` : '';
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