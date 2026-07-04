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
import {
  ArrowLeft, Search, AlertTriangle, RefreshCw, ExternalLink,
  Bot as BotIcon, MessageSquare, ChevronRight, Loader2, Clock,
} from 'lucide-react';
import { fetchApi } from '../../services/api';
import ConfidenceBadge from '../../components/shared/ConfidenceBadge';

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

interface AIMetadata {
  confidence: number;
  model: string;
  promptVersion: string | null;
  botVersion: string | null;
  sources: Array<{ sourceName: string; sourceType: string; relevanceScore?: number }> | null;
  tools: Array<{ toolId: string; toolName: string; resultSummary?: string; input?: unknown; output?: unknown; durationMs?: number }> | null;
  matchedTrigger: string | null;
  matchedRule: string | null;
  skipReason: string | null;
}

interface ThreadMessage {
  id: string;
  direction: 'incoming' | 'outgoing' | 'system';
  content: string;
  timestamp: string;
  fromName: string;
  fromNumber: string;
  aiMetadata: AIMetadata | null;
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

const ENGINE_VERSION = '0.9.0'; // must match package.json or backend version

// ─── Skip reason labels ──────────────────────────────────────────────────────

const SKIP_LABELS: Record<string, string> = {
  confidence_threshold: 'AI confidence below threshold',
  no_trigger_matched: 'No trigger matched this message',
  handoff_active: 'Human handoff was active',
  bot_disabled: 'Chatbot was disabled',
  rule_skip: 'Response rule returned skip',
  workflow_stop: 'Workflow execution stopped',
  manual_override: 'Manual override was active',
};

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
  const customerMessages = messages.filter(m => m.direction === 'incoming');

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatRelative = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = Date.now();
      const diff = now - d.getTime();
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString();
    } catch { return ts; }
  };

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
          {/* Search */}
          <div className="p-3 border-b border-[#2d2813]">
            <div className="flex items-center gap-2 bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-[#6e684a] shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customers…"
                className="flex-1 bg-transparent text-xs text-white placeholder:text-[#5a554a] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#5a554a] hover:text-white text-xs">✕</button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConv ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-[#6e684a]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#3d3813]" />
                <p className="text-xs text-[#6e684a]">No conversations found</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedConvId(conv.conversationId)}
                  className={`w-full text-left px-3 py-3 border-b border-[#2d2813] hover:bg-[#1a1915] transition ${
                    selectedConvId === conv.conversationId ? 'bg-[#1a1915] border-l-2 border-l-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-yellow-400">
                        {(conv.customerName || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">{conv.customerName || 'Unknown'}</p>
                        {(conv.lowConfidence || conv.wasEscalated) && (
                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#6e684a] truncate">{conv.customerNumber}</p>
                    </div>
                    <div className="text-[9px] text-[#5a554a] shrink-0">{formatRelative(conv.lastMessageAt)}</div>
                  </div>
                  <p className="text-[10px] text-[#6e684a] mt-1 truncate pl-10">{conv.lastMessage}</p>
                  <div className="flex items-center gap-2 mt-1 pl-10">
                    <span className="text-[9px] text-[#5a554a]">{conv.messageCount} msgs</span>
                    {conv.unreadCount > 0 && (
                      <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-bold">{conv.unreadCount}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Center: Message thread ───────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MessageSquare className="w-10 h-10 text-[#3d3813] mb-3" />
              <p className="text-sm font-semibold text-[#6e684a]">Select a conversation</p>
              <p className="text-xs text-[#5a554a] mt-1">Choose from the list on the left to inspect the full thread</p>
            </div>
          ) : loadingThread ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#6e684a]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#6e684a]">No messages in this conversation</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} onClick={() => setSelectedMsgId(msg.id)}>
                  {msg.direction === 'incoming' ? (
                    // Customer bubble
                    <div className="flex justify-end">
                      <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-yellow-400 text-black">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-1.5 mt-1 justify-end">
                          <span className="text-[9px] text-black/40">{formatTime(msg.timestamp)}</span>
                          {msg.aiMetadata === null && (
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedMsgId(msg.id); }}
                              className="flex items-center gap-1 text-[9px] text-red-500 hover:text-red-400"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Bot didn't respond
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : msg.direction === 'outgoing' ? (
                    // Bot bubble
                    <div className="flex justify-start">
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-bl-md cursor-pointer transition ${
                          selectedMsgId === msg.id
                            ? 'bg-yellow-500/10 border border-yellow-500/30'
                            : 'bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3a1e]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <BotIcon className="w-3 h-3 text-yellow-400 shrink-0" />
                          <span className="text-[10px] font-bold text-[#6e684a]">{msg.fromName || 'Bot'}</span>
                          <span className="text-[9px] text-[#5a554a]">{formatTime(msg.timestamp)}</span>
                          {selectedMsgId === msg.id && (
                            <button
                              onClick={e => { e.stopPropagation(); replayMessage(msg.id); }}
                              disabled={isReplaying}
                              className="ml-auto flex items-center gap-1 text-[9px] text-yellow-400 hover:text-yellow-300 disabled:opacity-40"
                            >
                              <RefreshCw className={`w-3 h-3 ${isReplaying ? 'animate-spin' : ''}`} />
                              Replay
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>

                        {/* AI metadata badges */}
                        {msg.aiMetadata && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <ConfidenceBadge confidence={msg.aiMetadata.confidence} />
                            {msg.aiMetadata.matchedTrigger && (
                              <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                                {msg.aiMetadata.matchedTrigger}
                              </span>
                            )}
                            {msg.aiMetadata.sources && msg.aiMetadata.sources.length > 0 && (
                              <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                                {msg.aiMetadata.sources[0].sourceName}
                                {msg.aiMetadata.sources.length > 1 ? ` +${msg.aiMetadata.sources.length - 1}` : ''}
                              </span>
                            )}
                            {msg.aiMetadata.tools && msg.aiMetadata.tools.length > 0 && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                {msg.aiMetadata.tools[0].toolName}
                                {msg.aiMetadata.tools.length > 1 ? ` +${msg.aiMetadata.tools.length - 1}` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // System message
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-full text-[10px] text-[#6e684a]">
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Replay result bubble */}
              {replayResult && (
                <div className="flex justify-start mt-2">
                  <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-green-900/20 border border-green-500/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <RefreshCw className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] font-bold text-green-400">REPLAY (current config)</span>
                    </div>
                    {replayResult.shouldRespond ? (
                      <>
                        <p className="text-sm text-white">Bot would respond</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <ConfidenceBadge confidence={replayResult.confidence} />
                          {replayResult.matchedTrigger && (
                            <span className="text-[9px] text-yellow-400">Trigger: {replayResult.matchedTrigger}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-400 text-sm">
                        <AlertTriangle className="w-3 h-3" />
                        {replayResult.skipReason
                          ? (SKIP_LABELS[replayResult.skipReason] ?? replayResult.skipReason)
                          : 'Bot would not respond'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Debug drawer ─────────────────────────────────── */}
        {selectedMsg && selectedMsg.aiMetadata && (
          <div className="w-60 shrink-0 border-l border-[#2d2813] overflow-y-auto bg-[#11100b]">
            <div className="p-4 space-y-4">

              {/* Trigger / Rule */}
              {(selectedMsg.aiMetadata.matchedTrigger || selectedMsg.aiMetadata.matchedRule) && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Match</p>
                  <div className="space-y-1">
                    {selectedMsg.aiMetadata.matchedTrigger && (
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <span className="text-[#6e684a]">Trigger:</span>
                        <span className="font-mono text-yellow-400">{selectedMsg.aiMetadata.matchedTrigger}</span>
                      </div>
                    )}
                    {selectedMsg.aiMetadata.matchedRule && (
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <span className="text-[#6e684a]">Rule:</span>
                        <span>{selectedMsg.aiMetadata.matchedRule}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Confidence</p>
                <ConfidenceBadge confidence={selectedMsg.aiMetadata.confidence} />
              </div>

              {/* Sources */}
              {selectedMsg.aiMetadata.sources && selectedMsg.aiMetadata.sources.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Knowledge Sources</p>
                  <div className="space-y-1">
                    {selectedMsg.aiMetadata.sources.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <div>
                          <p className="text-white">{s.sourceName}</p>
                          {s.relevanceScore !== undefined && (
                            <p className="text-[10px] text-[#6e684a]">{Math.round(s.relevanceScore * 100)}% relevant</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools */}
              {selectedMsg.aiMetadata.tools && selectedMsg.aiMetadata.tools.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Tools Called</p>
                  <div className="space-y-2">
                    {selectedMsg.aiMetadata.tools.map((t, i) => (
                      <div key={i} className="bg-[#1a1915] border border-[#2d2813] rounded-lg p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">{t.toolName}</span>
                          {t.durationMs !== undefined && (
                            <span className="text-[9px] text-[#6e684a] flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />{t.durationMs}ms
                            </span>
                          )}
                        </div>
                        {t.input && (
                          <div>
                            <p className="text-[9px] text-[#6e684a]">input:</p>
                            <pre className="text-[9px] text-white font-mono bg-[#181711] p-1 rounded overflow-auto">
                              {JSON.stringify(t.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {t.output && (
                          <div>
                            <p className="text-[9px] text-[#6e684a]">output:</p>
                            <pre className="text-[9px] text-white font-mono bg-[#181711] p-1 rounded overflow-auto">
                              {typeof t.output === 'string' ? t.output : JSON.stringify(t.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model / Version info */}
              {selectedMsg.aiMetadata.model && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Model</p>
                  <p className="text-xs text-white">{selectedMsg.aiMetadata.model}</p>
                  <p className="text-[10px] text-[#6e684a] mt-0.5">
                    {selectedMsg.aiMetadata.botVersion && `Bot v${selectedMsg.aiMetadata.botVersion}`}
                    {selectedMsg.aiMetadata.botVersion && selectedMsg.aiMetadata.promptVersion && ' · '}
                    {selectedMsg.aiMetadata.promptVersion && `Prompt v${selectedMsg.aiMetadata.promptVersion}`}
                    {' · '}
                    Engine {ENGINE_VERSION}
                  </p>
                </div>
              )}

              {/* Traces */}
              {selectedMsgTraces.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Traces</p>
                  <div className="space-y-1">
                    {selectedMsgTraces.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-20 shrink-0 bg-[#1a1915] rounded px-1.5 py-0.5 text-[9px] text-[#6e684a] font-mono truncate">
                          {t.step}
                        </div>
                        <div className="flex-1 h-1 bg-[#2d2813] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${Math.min(100, (t.durationMs / Math.max(...selectedMsgTraces.map(x => x.durationMs))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[#6e684a] w-10 text-right shrink-0">
                          {t.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Customer */}
              {selectedConvId && (
                <a
                  href={`/client/messages?conversationId=${selectedConvId}`}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#1a1915] border border-[#2d2813] hover:border-yellow-500/30 text-xs text-[#6e684a] hover:text-yellow-400 rounded-lg transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Customer
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
