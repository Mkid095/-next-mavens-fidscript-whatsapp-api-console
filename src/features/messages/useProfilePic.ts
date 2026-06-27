import { useEffect, useState } from 'react';
import { messagesApi } from './messagesApi';

// Lazy per-(instance, number) profile picture fetch with a module-level cache so
// we don't re-request the same avatar as the user scrolls the chat list.
const cache = new Map<string, string | null>();

export function useProfilePic(instanceName: string | null, number: string | null): string | null | undefined {
  const key = instanceName && number ? `${instanceName}::${number}` : '';
  const cached = key ? cache.get(key) : undefined;
  const [url, setUrl] = useState<string | null | undefined>(cached);

  useEffect(() => {
    if (!instanceName || !number) { setUrl(undefined); return; }
    if (cache.has(key)) { setUrl(cache.get(key) ?? null); return; }
    let cancelled = false;
    messagesApi.getProfilePic(instanceName, number).then((res) => {
      if (cancelled) return;
      const u = res.success && res.data ? res.data.url : null;
      cache.set(key, u);
      setUrl(u);
    });
    return () => { cancelled = true; };
  }, [instanceName, number, key]);

  return url;
}
