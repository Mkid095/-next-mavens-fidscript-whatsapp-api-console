/**
 * TestStep — Step 9 of the Chatbot Builder.
 * Thin shell: owns test state, sends messages, delegates UI to sub-components.
 */
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, RefreshCw, Bot } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { fetchApi } from '../../../../services/api';
import { TestRunner } from './TestRunner';
import { TestResult } from './TestResult';

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

export default function TestStep() {
  const { draft } = useChatbotBuilderStore();
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugPayload, setDebugPayload] = useState<DebugPayload | null>(null);
  const [showFullDebug, setShowFullDebug] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          { id: `sys-${Date.now()}`, role: 'system', text: 'No response received. Is the chatbot saved and enabled?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'system', text: `Error: ${String(err)}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
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

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <MessageSquare className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Test Your Chatbot</p>
          <p className="text-xs text-[#8f834a] mt-0.5">
            {isDisabled ? 'Save the chatbot first before testing.' : 'Send messages as a customer would. See how your bot responds and what it uses to answer.'}
          </p>
        </div>
        {conversationStarted && (
          <button onClick={clearConversation} className="ml-auto flex items-center gap-1.5 text-xs text-[#6e684a] hover:text-white transition">
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Main layout */}
      <div className={`flex gap-5 ${!conversationStarted ? 'justify-center' : ''}`}>
        <TestRunner
          messages={messages}
          input={input}
          loading={loading}
          isDisabled={isDisabled}
          conversationStarted={conversationStarted}
          draft={draft}
          messagesEndRef={messagesEndRef}
          onInputChange={setInput}
          onSend={sendMessage}
        />
        {conversationStarted && debugPayload && (
          <TestResult
            debug={debugPayload}
            expanded={showFullDebug}
            onToggleExpanded={() => setShowFullDebug(v => !v)}
          />
        )}
        {conversationStarted && !debugPayload && !loading && messages.length > 0 && (
          <div className="w-64 shrink-0 bg-[#0d0c0a] border border-[#2d2813] rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Bot className="w-6 h-6 text-[#3d3823] mb-2" />
            <p className="text-xs text-[#6e684a]">Debug info will appear here after the bot responds</p>
          </div>
        )}
      </div>
    </div>
  );
}
