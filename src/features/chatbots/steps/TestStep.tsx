/**
 * TestStep — Step 9 of the Chatbot Builder.
 *
 * WhatsApp-style chat simulator for live testing of the chatbot.
 * Shows conversation flow, matched triggers, knowledge attribution,
 * and a detailed debug panel.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Zap,
  Brain,
  Database,
  Lightbulb,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { fetchApi } from '../../../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TestMessage {
  id: string;
  role: 'customer' | 'bot' | 'system';
  text: string;
  time: string;
  matchedTrigger?: string;
  matchedRule?: string;
  knowledgeSources?: string[];
  tokensUsed?: number;
  latencyMs?: number;
  confidence?: number;
}

interface DebugPayload {
  matched_trigger?: string;
  matched_rule?: string;
  knowledge_sources?: string[];
  tokens_used?: number;
  latency_ms?: number;
  confidence?: number;
  trigger_type?: string;
  rule_confidence?: number;
  ai_response?: string;
  raw?: Record<string, unknown>;
}

// ─── Quick-test phrases ─────────────────────────────────────────────────────────

const QUICK_PHRASES = [
  'Hello!',
  'What are your hours?',
  'I need help with my order',
  'What\'s your return policy?',
  'Do you ship internationally?',
  'I want to speak to a human',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TestStep() {
  const { draft } = useChatbotBuilderStore();
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugPayload, setDebugPayload] = useState<DebugPayload | null>(null);
  const [showFullDebug, setShowFullDebug] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !draft.id) return;

    const customerMsg: TestMessage = {
      id: `cust-${Date.now()}`,
      role: 'customer',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, customerMsg]);
    setInput('');
    setLoading(true);
    setDebugPayload(null);
    setConversationStarted(true);

    const startTime = Date.now();

    try {
      const res = await fetchApi(`/api/platform/chatbots/${draft.id}/test-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      }) as { success: boolean; data?: Record<string, unknown> };

      const latencyMs = Date.now() - startTime;

      if (res.success && res.data) {
        const data = res.data as DebugPayload;
        const botMsg: TestMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: data.ai_response ?? 'No response',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchedTrigger: data.matched_trigger,
          matchedRule: data.matched_rule,
          knowledgeSources: data.knowledge_sources,
          tokensUsed: data.tokens_used,
          latencyMs,
          confidence: data.confidence,
        };
        setMessages(prev => [...prev, botMsg]);
        setDebugPayload(data);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            text: 'No response received. Is the chatbot saved and enabled?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          text: `Error: ${String(err)}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setDebugPayload(null);
    setConversationStarted(false);
  };

  const isDisabled = !draft.id;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <MessageSquare className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Test Your Chatbot</p>
          <p className="text-xs text-[#8f834a] mt-0.5">
            {isDisabled
              ? 'Save the chatbot first before testing.'
              : 'Send messages as a customer would. See how your bot responds and what it uses to answer.'
            }
          </p>
        </div>
        {conversationStarted && (
          <button
            onClick={clearConversation}
            className="ml-auto flex items-center gap-1.5 text-xs text-[#6e684a] hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* ── Main layout: chat + debug sidebar ────────────────────────────── */}
      <div className={`flex gap-5 ${!conversationStarted ? 'justify-center' : ''}`}>

        {/* ── WhatsApp-style chat ──────────────────────────────────────────── */}
        <div className={`${conversationStarted ? 'flex-1' : 'w-full max-w-lg'} bg-[#0d0c0a] border border-[#2d2813] rounded-2xl overflow-hidden flex flex-col`}>

          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2813] bg-[#1a1915] shrink-0">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {draft.general.name || 'Your Chatbot'}
              </p>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online — test mode
              </p>
            </div>
            {draft.general.enabled && (
              <span className="ml-auto text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                Enabled
              </span>
            )}
          </div>

          {/* Quick phrases (shown before first message) */}
          {!conversationStarted && (
            <div className="px-4 pt-4 pb-2 border-b border-[#2d2813]">
              <p className="text-[10px] text-[#6e684a] mb-2">Try a common phrase:</p>
              <div className="flex flex-wrap gap-1.5 pb-3">
                {QUICK_PHRASES.map(phrase => (
                  <button
                    key={phrase}
                    onClick={() => sendMessage(phrase)}
                    disabled={isDisabled}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] hover:border-yellow-500/40 hover:text-yellow-300 disabled:opacity-30 transition"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[420px]">
            {messages.length === 0 && conversationStarted && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-8 h-8 text-[#3d3823] mb-2" />
                <p className="text-sm text-[#6e684a]">Conversation cleared</p>
                <p className="text-[10px] text-[#5a554a] mt-1">Send a new message to start</p>
              </div>
            )}
            {messages.length === 0 && !conversationStarted && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-8 h-8 text-[#3d3823] mb-2" />
                <p className="text-sm text-[#6e684a]">Start typing to test</p>
                <p className="text-[10px] text-[#5a554a] mt-1">Type a message or click a quick phrase above</p>
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {loading && <TypingBubble />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-[#2d2813] bg-[#1a1915] shrink-0">
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !loading && input.trim()) {
                    sendMessage(input);
                  }
                }}
                disabled={isDisabled || loading}
                placeholder={isDisabled ? 'Save chatbot first...' : 'Type a message...'}
                className="flex-1 bg-[#0d0c0a] border border-[#2d2813] rounded-full px-4 py-2.5 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none disabled:opacity-40 transition"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isDisabled || loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-30 text-black flex items-center justify-center transition shrink-0"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Debug sidebar (shown after first response) ───────────────────── */}
        {conversationStarted && debugPayload && (
          <DebugSidebar
            debug={debugPayload}
            expanded={showFullDebug}
            onToggleExpanded={() => setShowFullDebug(v => !v)}
          />
        )}

        {/* Placeholder when no debug yet */}
        {conversationStarted && !debugPayload && !loading && messages.length > 0 && (
          <div className="w-64 shrink-0 bg-[#0d0c0a] border border-[#2d2813] rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Brain className="w-6 h-6 text-[#3d3823] mb-2" />
            <p className="text-xs text-[#6e684a]">Debug info will appear here after the bot responds</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: TestMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-full text-xs text-[#6e684a]">
          <XCircle className="w-3 h-3 text-red-400" />
          {msg.text}
        </div>
      </div>
    );
  }

  const isCustomer = msg.role === 'customer';

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isCustomer
            ? 'bg-yellow-400 text-black rounded-br-md'
            : 'bg-[#1a1915] border border-[#2d2813] text-white rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>

        {/* Meta row */}
        <div className={`flex items-center gap-2 mt-1.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[9px] ${isCustomer ? 'text-black/40' : 'text-[#5a554a]'}`}>
            {msg.time}
          </span>

          {/* Bot-specific meta badges */}
          {!isCustomer && msg.matchedTrigger && (
            <span className="flex items-center gap-0.5 text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/10 px-1.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" />
              {msg.matchedTrigger}
            </span>
          )}
          {!isCustomer && msg.latencyMs && (
            <span className="flex items-center gap-0.5 text-[9px] text-[#5a554a]">
              <Clock className="w-2.5 h-2.5" />
              {formatLatency(msg.latencyMs)}
            </span>
          )}
          {!isCustomer && msg.tokensUsed !== undefined && (
            <span className="text-[9px] text-[#5a554a]">
              {msg.tokensUsed.toLocaleString()} tokens
            </span>
          )}
        </div>

        {/* Knowledge source chips */}
        {!isCustomer && msg.knowledgeSources && msg.knowledgeSources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {msg.knowledgeSources.map((src, i) => (
              <span
                key={i}
                className="flex items-center gap-0.5 text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/10 px-1.5 py-0.5 rounded-full"
              >
                <BookOpen className="w-2.5 h-2.5" />
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#1a1915] border border-[#2d2813] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#6e684a] animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
        <span className="text-[10px] text-[#6e684a] ml-1">thinking…</span>
      </div>
    </div>
  );
}

function DebugSidebar({
  debug,
  expanded,
  onToggleExpanded,
}: {
  debug: DebugPayload;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  return (
    <div className="w-64 shrink-0 bg-[#0d0c0a] border border-[#2d2813] rounded-2xl overflow-hidden flex flex-col max-h-[460px]">
      <div className="px-4 py-3 border-b border-[#2d2813] bg-[#1a1915] flex items-center gap-2 shrink-0">
        <Brain className="w-4 h-4 text-yellow-400" />
        <p className="text-xs font-semibold text-white">What happened</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Trigger */}
        {debug.matched_trigger && (
          <DebugRow
            icon={<Zap className="w-3.5 h-3.5 text-yellow-400" />}
            label="Trigger"
            value={debug.matched_trigger}
            sub={debug.trigger_type ? `type: ${debug.trigger_type}` : undefined}
            status="matched"
          />
        )}

        {/* Rule */}
        {debug.matched_rule && (
          <DebugRow
            icon={<Lightbulb className="w-3.5 h-3.5 text-blue-400" />}
            label="Rule"
            value={debug.matched_rule}
            sub={debug.rule_confidence !== undefined ? `confidence: ${Math.round(debug.rule_confidence * 100)}%` : undefined}
            status="matched"
          />
        )}

        {/* Knowledge sources */}
        {debug.knowledge_sources && debug.knowledge_sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-[#6e684a]">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Knowledge used
            </div>
            {debug.knowledge_sources.map((src, i) => (
              <div key={i} className="flex items-center gap-1.5 pl-4">
                <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                <span className="text-xs text-white truncate">{src}</span>
              </div>
            ))}
          </div>
        )}

        {/* No trigger matched */}
        {!debug.matched_trigger && (
          <DebugRow
            icon={<XCircle className="w-3.5 h-3.5 text-[#6e684a]" />}
            label="Trigger"
            value="No trigger matched"
            status="none"
          />
        )}

        {/* Performance */}
        {(debug.latency_ms !== undefined || debug.tokens_used !== undefined) && (
          <div className="space-y-1">
            <div className="text-[10px] text-[#6e684a] uppercase tracking-wide">Performance</div>
            {debug.latency_ms !== undefined && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#6e684a]" />
                <span className="text-xs text-white">{formatLatency(debug.latency_ms)}</span>
              </div>
            )}
            {debug.tokens_used !== undefined && (
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#6e684a]" />
                <span className="text-xs text-white">
                  {debug.tokens_used.toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>
        )}

        {/* Confidence */}
        {debug.confidence !== undefined && (
          <div className="space-y-1">
            <div className="text-[10px] text-[#6e684a] uppercase tracking-wide">AI Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#2d2813] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    debug.confidence >= 0.8
                      ? 'bg-green-400'
                      : debug.confidence >= 0.5
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.round(debug.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-white font-mono">
                {Math.round(debug.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full debug toggle */}
      <div className="p-3 border-t border-[#2d2813] shrink-0">
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between text-[10px] text-[#6e684a] hover:text-white transition"
        >
          <span>Full debug output</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {expanded && (
          <pre className="mt-2 text-[9px] text-[#6e684a] font-mono bg-[#1a1915] p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(debug.raw ?? debug, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function DebugRow({
  icon,
  label,
  value,
  sub,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  status: 'matched' | 'none' | 'fired';
}) {
  const colorClass =
    status === 'matched'
      ? 'text-green-400'
      : status === 'none'
      ? 'text-[#6e684a]'
      : 'text-yellow-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-[#6e684a]">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-1.5 pl-4">
        {status === 'matched' && <CheckCircle2 className={`w-3 h-3 ${colorClass} shrink-0`} />}
        {status === 'none' && <XCircle className={`w-3 h-3 ${colorClass} shrink-0`} />}
        <span className={`text-xs ${status === 'none' ? 'text-[#6e684a]' : 'text-white'} truncate`}>
          {value}
        </span>
      </div>
      {sub && <p className="text-[9px] text-[#5a554a] pl-7">{sub}</p>}
    </div>
  );
}
