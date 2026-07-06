import React, { useRef, useEffect } from 'react';
import { MessageSquare, Save, Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'error';
  content: string;
  meta?: { trigger?: string; latency?: number; tokens?: number; sources?: string[]; confidence?: number };
}

interface ChatSimulatorProps {
  messages: ChatMessage[];
  input: string;
  sending: boolean;
  botId: string | null;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
  onClear: () => void;
}

const QUICK_TESTS = ['Hello, how are you?', 'What can you help me with?', 'I have a question about my order'];

export default function ChatSimulator({ messages, input, sending, botId, onInputChange, onSend, onClear }: ChatSimulatorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  return (
    <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2813]">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-yellow-400" />
          <p className="text-xs font-bold text-white">Chat Simulator</p>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-[#6e684a] hover:text-[#a8a99e]">Clear</button>
        )}
      </div>

      <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-3">
        {!botId ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Save size={32} className="text-[#3d3823] mb-3" />
            <p className="text-xs font-semibold text-white mb-1">Save the bot first</p>
            <p className="text-[11px] text-[#6e684a] mb-4 max-w-xs">The chat simulator needs a saved bot to send test messages.</p>
            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }))}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-stone-900 rounded-lg text-xs font-bold hover:bg-yellow-400 transition">
              <Save size={12} /> Save Draft
            </button>
          </div>
        ) : messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={32} className="text-[#3d3823] mb-2" />
            <p className="text-xs text-[#6e684a] mb-3">Type a message to test your bot</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_TESTS.map(q => (
                <button key={q} onClick={() => onSend(q)}
                  className="px-2.5 py-1 bg-[#1a1915] border border-[#2d2813] rounded-full text-[10px] text-[#a8a99e] hover:border-yellow-500/30 transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-[#1a1915] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-[#6e684a] rounded-full"
                  style={{ animation: `bounce 1s infinite ${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#2d2813] p-3 flex gap-2">
        <input type="text" value={input} onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !sending && botId) onSend(input); }}
          placeholder={botId ? 'Type a message...' : 'Save the bot first to test...'}
          disabled={sending || !botId}
          className="flex-1 bg-[#1a1915] border border-[#2d2813] rounded-xl px-3 py-2 text-white text-xs placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none disabled:opacity-50" />
        <button onClick={() => onSend(input)}
          disabled={sending || !input.trim() || !botId}
          className="flex items-center justify-center w-9 h-9 bg-yellow-500 text-stone-900 rounded-xl hover:bg-yellow-400 transition disabled:opacity-30 shrink-0">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
