import React from 'react';
import { Zap, Clock } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'error';
  content: string;
  meta?: {
    trigger?: string;
    latency?: number;
    tokens?: number;
    sources?: string[];
    confidence?: number;
  };
}

interface MessageBubbleProps {
  msg: ChatMessage;
}

export default function MessageBubble({ msg }: MessageBubbleProps) {
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-xs ${
          msg.role === 'user' ? 'bg-yellow-500/20 text-yellow-100 rounded-br-sm' :
          msg.role === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
          'bg-[#1a1915] text-[#cbd3cf] rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.meta && msg.role === 'bot' && (
          <div className="flex flex-wrap gap-2 mt-1 ml-1">
            {msg.meta.trigger && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-yellow-400">
                <Zap size={8} /> {msg.meta.trigger}
              </span>
            )}
            {typeof msg.meta.latency === 'number' && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[#6e684a]">
                <Clock size={8} /> {msg.meta.latency}ms
              </span>
            )}
            {typeof msg.meta.tokens === 'number' && msg.meta.tokens > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[#6e684a]">
                {msg.meta.tokens} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
