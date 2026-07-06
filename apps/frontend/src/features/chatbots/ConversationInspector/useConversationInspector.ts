import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../services/api';
import type { Conversation, ThreadMessage, Trace, ReplayResult } from './types';

export function useConversationInspector(clientToken: string) {
  const { id: botId } = useParams<{ id: string }>();

  const [botName, setBotName] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load bot name
  useEffect(() => {
    if (!botId) return;
    fetchApi(`/api/platform/chatbots/${botId}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    }).then((res: unknown) => {
      const r = res as { success: boolean; data: { name?: string }; error?: string };
      if (r.success && r.data) setBotName(r.data.name ?? 'Chatbot');
      else setError(r.error ?? 'Failed to load chatbot');
    }).catch(() => setError('Network error loading chatbot'));
  }, [botId, clientToken]);

  // Load conversations (debounced search)
  const loadConversations = useCallback(async () => {
    if (!botId) return;
    setLoadingConv(true);
    setError(null);
    try {
      const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetchApi(`/api/platform/chatbots/${botId}/conversations${q}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      }) as { success: boolean; data: Conversation[]; error?: string };
      if (res.success) setConversations(res.data);
      else setError(res.error ?? 'Failed to load conversations');
    } catch { setError('Network error loading conversations'); } finally { setLoadingConv(false); }
  }, [botId, clientToken, searchQuery]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(loadConversations, 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, loadConversations]);

  // Load thread + traces
  const loadThread = useCallback(async (convId: string) => {
    setLoadingThread(true);
    setSelectedMsgId(null);
    setReplayResult(null);
    setError(null);
    try {
      const [msgRes, traceRes] = await Promise.all([
        fetchApi(`/api/platform/conversations/${convId}/messages`, { headers: { Authorization: `Bearer ${clientToken}` } }) as unknown as { success: boolean; data: ThreadMessage[]; error?: string },
        fetchApi(`/api/platform/conversations/${convId}/traces`, { headers: { Authorization: `Bearer ${clientToken}` } }) as unknown as { success: boolean; data: Trace[]; error?: string },
      ]);
      if (msgRes.success) setMessages(msgRes.data);
      else setError(msgRes.error ?? 'Failed to load messages');
      if (traceRes.success) setTraces(traceRes.data);
    } catch { setError('Network error loading thread'); } finally { setLoadingThread(false); }
  }, [clientToken]);

  useEffect(() => { if (selectedConvId) loadThread(selectedConvId); }, [selectedConvId, loadThread]);

  // Replay
  const replayMessage = async (msgId: string) => {
    if (!botId) return;
    setIsReplaying(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/platform/chatbots/${botId}/replay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      }) as { success: boolean; data: ReplayResult; error?: string };
      if (res.success) { setReplayResult(res.data); setToast({ text: 'Replay complete', type: 'success' }); }
      else setError(res.error ?? 'Replay failed');
    } catch { setError('Network error during replay'); } finally { setIsReplaying(false); }
  };

  useEffect(() => { setReplayResult(null); }, [selectedMsgId, selectedConvId]);

  return {
    botName, conversations, selectedConvId, messages, traces, selectedMsgId,
    replayResult, isReplaying, loadingConv, loadingThread, searchQuery, error, toast,
    setSelectedConvId, setSearchQuery, setSelectedMsgId, setError, setToast,
    replayMessage,
  };
}
