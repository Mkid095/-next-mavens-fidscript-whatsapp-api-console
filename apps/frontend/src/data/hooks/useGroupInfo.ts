import { useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';

export interface GroupInfo { subject: string; size: number; owner: string | null; }

// Fetches the group subject/size/owner for a group JID. Returns subject='' while
// loading or if the group isn't in Evolution (graceful fallback).
export function useGroupInfo(chatId: string | null): GroupInfo {
  const [info, setInfo] = useState<GroupInfo>({ subject: '', size: 0, owner: null });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId || !chatId.includes('@g.us')) {
      setInfo({ subject: '', size: 0, owner: null });
      setLoadedFor(null);
      return;
    }
    if (loadedFor === chatId) return;
    let cancelled = false;
    platformApi.getGroupInfo(chatId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setInfo(res.data);
        setLoadedFor(chatId);
      }
    });
    return () => { cancelled = true; };
  }, [chatId, loadedFor]);

  return info;
}
