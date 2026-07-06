/**
 * TestRunner — WhatsApp-style chat UI: bubbles, typing indicator, input bar.
 */
import React from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Zap,
  Clock,
  Bot,
  BookOpen,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

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

const QUICK_PHRASES = [
  'Hello!', 'What are your hours?', 'I need help with my order',
  'What\'s your return policy?', 'Do you ship internationally?',
  'I want to speak to a human',
];

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function MessageBubble({ msg }: { msg: TestMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-full text-xs text-[#6e684a]">
          <XCircle className="w-3 h-3 text-red-400" /> {msg.text}
        </div>
      </div>
    );
  }

  const isCustomer = msg.role === 'customer';

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isCustomer ? 'bg-yellow-400 text-black rounded-br-md' : 'bg-[#1a1915] border border-[#2d2813] text-white rounded-bl-md'
      }`}>
        <p className="whitespace-pre-wrap">{msg.text}</p>
        <div className={`flex items-center gap-2 mt-1.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[9px] ${isCustomer ? 'text-black/40' : 'text-[#5a554a]'}`}>{msg.time}</span>
          {!isCustomer && msg.matchedTrigger && (
            <span className="flex items-center gap-0.5 text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/10 px-1.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" />{msg.matchedTrigger}
            </span>
          )}
          {!isCustomer && msg.latencyMs && (
            <span className="flex items-center gap-0.5 text-[9px] text-[#5a554a]"><Clock className="w-2.5 h-2.5" />{formatLatency(msg.latencyMs)}</span>
          )}
          {!isCustomer && msg.tokensUsed !== undefined && (
            <span className="text-[9px] text-[#5a554a]">{msg.tokensUsed.toLocaleString()} tokens</span>
          )}
        </div>
        {!isCustomer && msg.knowledgeSources && msg.knowledgeSources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {msg.knowledgeSources.map((src, i) => (
              <span key={i} className="flex items-center gap-0.5 text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/10 px-1.5 py-0.5 rounded-full">
                <BookOpen className="w-2.5 h-2.5" />{src}
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
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#6e684a] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
        <span className="text-[10px] text-[#6e684a] ml-1">thinking…</span>
      </div>
    </div>
  );
}

export function TestRunner({
  messages,
  input,
  loading,
  isDisabled,
  conversationStarted,
  draft,
  messagesEndRef,
  onInputChange,
  onSend,
}: {
  messages: TestMessage[];
  input: string;
  loading: boolean;
  isDisabled: boolean;
  conversationStarted: boolean;
  draft: { general: { name: string; enabled: boolean }; id?: string };
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
}) {
  return (
    <div className={`${conversationStarted ? 'flex-1' : 'w-full max-w-lg'} bg-[#0d0c0a] border border-[#2d2813] rounded-2xl overflow-hidden flex flex-col`}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2813] bg-[#1a1915] shrink-0">
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-yellow-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{draft.general.name || 'Your Chatbot'}</p>
          <p className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Online — test mode
          </p>
        </div>
        {draft.general.enabled && (
          <span className="ml-auto text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Enabled</span>
        )}
      </div>

      {/* Quick phrases */}
      {!conversationStarted && (
        <div className="px-4 pt-4 pb-2 border-b border-[#2d2813]">
          <p className="text-[10px] text-[#6e684a] mb-2">Try a common phrase:</p>
          <div className="flex flex-wrap gap-1.5 pb-3">
            {QUICK_PHRASES.map(phrase => (
              <button
                key={phrase}
                onClick={() => onSend(phrase)}
                disabled={isDisabled}
                className="text-xs px-3 py-1.5 rounded-full bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] hover:border-yellow-500/40 hover:text-yellow-300 disabled:opacity-30 transition"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
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
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingBubble />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#2d2813] bg-[#1a1915] shrink-0">
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading && input.trim()) onSend(input); }}
            disabled={isDisabled || loading}
            placeholder={isDisabled ? 'Save chatbot first...' : 'Type a message...'}
            className="flex-1 bg-[#0d0c0a] border border-[#2d2813] rounded-full px-4 py-2.5 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none disabled:opacity-40 transition"
          />
          <button
            onClick={() => onSend(input)}
            disabled={isDisabled || loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-30 text-black flex items-center justify-center transition shrink-0"
            aria-label="Send message"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
