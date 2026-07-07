/**
 * ConversationInspector — Priority 3 (V1)
 *
 * Debug tool for inspecting real customer conversations with a chatbot.
 * Three-panel layout:
 *   Left (260px):  conversation list with search + filters
 *   Center (flex-1): WhatsApp thread with AI metadata badges
 *   Right (240px):  debug drawer (confidence, sources, tools, traces, replay)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { fetchApi } from '../../../services/api';
import FilterBar from './FilterBar';
import ConversationList from './ConversationList';
import MessageDetail from './MessageDetail';
import DebugDrawer from './DebugDrawer';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Conversation {
  conversationId: string;
  customerName: string;
  customerNumber: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  lowConfidence: boolean;
  wasEscalated: boolean;
}

interface ThreadMessage {
  id: string;
  direction: 'incoming' | 'outgoing' | 'system';
  content: string;
  timestamp: string;
  fromName: string;
  fromNumber: string;
  aiMetadata: {
    confidence: number;
    model: string;
    promptVersion: string | null;
    botVersion: string | null;
    sources: Array<{ sourceName: string; sourceType: string; relevanceScore?: number }> | null;
    tools: Array<{ toolId: string; toolName: string; resultSummary?: string; input?: unknown; output?: unknown; durationMs?: number }> | null;
    matchedTrigger: string | null;
    matchedRule: string | null;
    skipReason: string | null;
  } | null;
}

interface Trace {
  messageId: string;
  step: string;
  durationMs: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ReplayResult {
  matchedTrigger: string | null;
  matchedRule: string | null;
  confidence: number;
  shouldRespond: boolean;
  skipReason: string | null;
}

// ─── Version ─────────────────────────────────────────────────────────────────

const ENGINE_VERSION = '0.9.0';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConversationInspector({ clientToken }: { clientToken: string }) {
  const navigate = useNavigate();
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

  // Load bot name
  useEffect(() => {
    if (!botId) return;
    fetchApi(`/api/platform/chatbots/${botId}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    }).then((res: unknown) => {
      const r = res as { success: boolean; data: { name?: string } };
      if (r.success && r.data) setBotName(r.data.name ?? 'Chatbot');
    }).catch(() => {});
  }, [botId, clientToken]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!botId) return;
    setLoadingConv(true);
    try {
      const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetchApi(`/api/platform/chatbots/${botId}/conversations${q}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      }) as { success: boolean; data: Conversation[] };
      if (res.success) setConversations(res.data);
    } finally { setLoadingConv(false); }
  }, [botId, clientToken, searchQuery]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load thread + traces when conversation selected
  const loadThread = useCallback(async (convId: string) => {
    setLoadingThread(true);
    setSelectedMsgId(null);
    setReplayResult(null);
    try {
      const [msgRes, traceRes] = await Promise.all([
        fetchApi(`/api/platform/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${clientToken}` },
        }) as unknown as { success: boolean; data: ThreadMessage[] },
        fetchApi(`/api/platform/conversations/${convId}/traces`, {
          headers: { Authorization: `Bearer ${clientToken}` },
        }) as unknown as { success: boolean; data: Trace[] },
      ]);
      if (msgRes.success) setMessages(msgRes.data);
      if (traceRes.success) setTraces(traceRes.data);
    } finally { setLoadingThread(false); }
  }, [clientToken]);

  useEffect(() => {
    if (selectedConvId) loadThread(selectedConvId);
  }, [selectedConvId, loadThread]);

  // Replay a customer message
  const replayMessage = async (msgId: string) => {
    if (!botId) return;
    setIsReplaying(true);
    try {
      const res = await fetchApi(`/api/platform/chatbots/${botId}/replay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      }) as { success: boolean; data: ReplayResult };
      if (res.success) setReplayResult(res.data);
    } finally { setIsReplaying(false); }
  };

  const selectedMsg = messages.find(m => m.id === selectedMsgId);
  const selectedMsgTraces = traces.filter(t => t.messageId === selectedMsgId);

  return (
    <div className="flex flex-col h-screen bg-[#11100b] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2813] shrink-0">
        <button
          onClick={() => navigate('/client/chatbots')}
          className="flex items-center gap-1.5 text-sm text-[#6e684a] hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Chatbots
        </button>
        <ChevronRight className="w-3 h-3 text-[#3d3813]" />
        <span className="text-sm font-bold text-white">{botName || '…'}</span>
        <span className="ml-auto text-xs text-[#6e684a]">Inspector</span>
      </div>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Conversation list ───────────────────────────────── */}
        <div className="w-64 shrink-0 border-r border-[#2d2813] flex flex-col overflow-hidden">
          <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <ConversationList
            conversations={conversations}
            selectedConvId={selectedConvId}
            loadingConv={loadingConv}
            onSelect={setSelectedConvId}
          />
        </div>

        {/* ── Center: Message thread ───────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MessageSquare className="w-10 h-10 text-[#3d3813] mb-3" />
              <p className="text-sm font-semibold text-[#6e684a]">Select a conversation</p>
              <p className="text-xs text-[#5a554a] mt-1">Choose from the list on the left to inspect the full thread</p>
            </div>
          ) : (
            <MessageDetail
              messages={messages}
              selectedMsgId={selectedMsgId}
              isReplaying={isReplaying}
              loadingThread={loadingThread}
              replayResult={replayResult}
              onSelectMsg={setSelectedMsgId}
              onReplay={replayMessage}
            />
          )}
        </div>

        {/* ── Right: Debug drawer ─────────────────────────────────── */}
        <DebugDrawer
          selectedMsg={selectedMsg}
          selectedMsgTraces={selectedMsgTraces}
          selectedConvId={selectedConvId}
          engineVersion={ENGINE_VERSION}
        />
      </div>
    </div>
  );
}
