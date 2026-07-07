import { useCallback, useEffect, useRef, useState } from 'react';
import { dataEvents } from '../../../data';
import { messagesApi, type MirrorMessage } from '../messagesApi';
import { scheduleRefresh } from '../useSharedRefreshGate';

/**
 * Two-tier message cache for instant chat switching:
 * 1. In-memory Map  — lives for the browser tab session
 * 2. localStorage  — persists across page reloads (up to 50 chats, 200 msgs each)
 *
 * On chat switch: show cached messages instantly, fetch only if not yet cached.
 * Real-time SSE events append new messages to the cache so it stays fresh.
 */
const MAX_LOCALSTORAGE_CHATS = 50;
const MAX_MESSAGES_PER_CHAT = 200;

const LS_KEY = 'wap_chat_cache_v1';

interface CacheEntry { messages: MirrorMessage[]; ts: number; }
type DiskCache = Record<string, CacheEntry>;

function loadDiskCache(): Map<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as DiskCache;
    return new Map(Object.entries(parsed));
  } catch { return new Map; }
}

function saveDiskCache(cache: Map<string, CacheEntry>) {
  try {
    const entries = Array.from(cache.entries());
    const trimmed = entries.length > MAX_LOCALSTORAGE_CHATS
      ? entries.slice(-MAX_LOCALSTORAGE_CHATS)
      : entries;
    const obj = Object.fromEntries(trimmed) as DiskCache;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch { /* quota or private mode — ignore */ }
}

/** In-memory cache: lives for the tab session. */
const memCache = new Map<string, MirrorMessage[]>();
/** Disk cache: loaded once at startup, updated on every successful fetch. */
const diskCache = loadDiskCache();
/** Set of cacheKeys that have been fetched at least once this session. */
const hasLoaded = new Set<string>();

export function useChatMessages(instanceName: string | null, jid: string | null) {
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track the previous jid to detect chat switches
  const prevJidRef = useRef<string | null>(null);
  // Guard SSE appends so only the currently open chat receives real-time messages
  const activeJidRef = useRef<string | null>(null);

  const cacheKey = instanceName && jid ? `${instanceName}|${jid}` : null;

  const fetchAndCache = useCallback(async () => {
    if (!instanceName || !jid) { setMessages([]); return; }
    setLoading(true);
    setError(null);
    const ck = cacheKey;
    const res = await messagesApi.getThread(instanceName, jid);
    setLoading(false);
    if (res.success && res.data) {
      const msgs = res.data.messages.slice(0, MAX_MESSAGES_PER_CHAT);
      // Only update state if we're still on this chat
      if (activeJidRef.current !== jid) return;
      memCache.set(ck!, msgs);
      diskCache.set(ck!, { messages: msgs, ts: Date.now() });
      saveDiskCache(diskCache);
      hasLoaded.add(ck!);
      setMessages(msgs);
      return;
    }
    if (activeJidRef.current === jid) setError(res.error || 'Failed to load messages');
  }, [instanceName, jid, cacheKey]);

  // Mark active jid — this prevents stale SSE events or old async fetch
  // completions from overwriting state after we've switched away
  useEffect(() => { activeJidRef.current = jid; }, [jid]);

  // Chat switch: show cached data instantly, only fetch if not yet loaded
  useEffect(() => {
    const prevJid = prevJidRef.current;
    prevJidRef.current = jid;

    if (!instanceName || !jid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Always set active jid so SSE guards work
    activeJidRef.current = jid;

    // Switching chats: clear immediately
    if (prevJid !== null && prevJid !== jid) {
      setMessages([]);
      setLoading(true);
    }

    const ck = cacheKey;
    if (!ck) return;

    // Prefer in-memory cache (instant), fall back to disk cache (instant on reload)
    const cached = memCache.get(ck) ?? diskCache.get(ck)?.messages;
    if (cached) {
      setMessages(cached);
      setLoading(false);
      // Only fetch if we've never loaded this chat before
      if (!hasLoaded.has(ck)) {
        void fetchAndCache();
      }
    } else {
      // Never cached — must fetch
      void fetchAndCache();
    }
  // fetchAndCache reads jid via closure so we omit it from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName, jid]);

  // Wildcard events — schedule a refresh for the currently open chat
  useEffect(() => {
    if (!instanceName || !jid) return;
    const off = dataEvents.on('*', () => {
      // Guard: only process for the currently active chat
      if (activeJidRef.current !== jid) return;
      scheduleRefresh(() => {
        if (activeJidRef.current !== jid) return;
        void fetchAndCache();
      });
    });
    return off;
  }, [instanceName, jid, fetchAndCache]);

  // Real-time message append — only for the open conversation
  useEffect(() => {
    if (!jid) return;
    const off = dataEvents.on('message.received', (event) => {
      // Silently ignore events for chats we're not currently viewing
      if (activeJidRef.current !== jid) return;
      const payload = event.payload as { chatId?: string; fromNumber?: string; fromName?: string; messageType?: string; content?: string; mediaUrl?: string | null; timestamp?: string };
      if (payload.chatId !== jid && payload.chatId !== ` ${jid}`) return;
      const msg: MirrorMessage = {
        id: `sse_${Date.now()}`,
        direction: 'incoming',
        type: payload.messageType || 'text',
        content: payload.content || '',
        mediaUrl: payload.mediaUrl || null,
        mediaMimetype: null,
        senderName: payload.fromName || null,
        senderJid: payload.fromNumber || null,
        timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      };
      const ck = cacheKey;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        if (ck) {
          memCache.set(ck, next);
          diskCache.set(ck, { messages: next, ts: Date.now() });
          saveDiskCache(diskCache);
        }
        return next;
      });
    });
    return off;
  }, [jid, cacheKey]);

  const optimisticAppend = useCallback((msg: MirrorMessage) => {
    const ck = cacheKey;
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      if (ck) {
        memCache.set(ck, next);
        diskCache.set(ck, { messages: next, ts: Date.now() });
        saveDiskCache(diskCache);
      }
      return next;
    });
  }, [cacheKey]);

  return { messages, loading, error, optimisticAppend };
}
