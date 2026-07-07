/**
 * MessageBubble — customer / bot / system message bubbles for test results.
 */
import React from 'react';
import { Zap, Clock, BookOpen, XCircle } from 'lucide-react';
import type { TestMessage } from './TestResultsMain';

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function MessageBubble({ msg }: { msg: TestMessage }) {
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
        <div
          className={`flex items-center gap-2 mt-1.5 ${
            isCustomer ? 'justify-end' : 'justify-start'
          }`}
        >
          <span
            className={`text-[9px] ${isCustomer ? 'text-black/40' : 'text-[#5a554a]'}`}
          >
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
        {!isCustomer &&
          msg.knowledgeSources &&
          msg.knowledgeSources.length > 0 && (
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

export function TypingBubble() {
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
