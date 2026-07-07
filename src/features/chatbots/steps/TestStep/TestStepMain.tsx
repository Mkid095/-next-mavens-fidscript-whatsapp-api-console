/**
 * TestStepMain — main test interface orchestrator.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { fetchApi } from '../../../../services/api';
import { TestForm } from './TestForm';
import {
  TestMessage,
  DebugPayload,
  MessageBubble,
  TypingBubble,
  DebugSidebar,
  EmptyConversation,
  ClearedConversation,
  Bot,
} from './TestResults';

// ─── Quick-test phrases ─────────────────────────────────────────────────────────

const QUICK_PHRASES = [
  'Hello!',
  'What are your hours?',
  'I need help with my order',
  'What\'s your return policy?',
  'Do you ship internationally?',
  'I want to speak to a human',
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function TestStepMain() {
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
              <ClearedConversation />
            )}
            {messages.length === 0 && !conversationStarted && (
              <EmptyConversation />
            )}

            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {loading && <TypingBubble />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <TestForm
            input={input}
            onInputChange={setInput}
            onSend={sendMessage}
            loading={loading}
            disabled={isDisabled}
          />
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
