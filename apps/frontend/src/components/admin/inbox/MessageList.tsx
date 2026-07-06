import React from 'react';
import { InboxMessage } from '../../../types';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface MessageListProps {
  messages: InboxMessage[];
  selectedMsg: InboxMessage | null;
  onSelect: (msg: InboxMessage) => void;
}

export default function MessageList({ messages, selectedMsg, onSelect }: MessageListProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d] mb-3 shrink-0">
        Webhook Events
      </span>

      <div className="flex-1 overflow-y-auto min-h-0 border border-[#e1e9e5]/80 bg-white rounded-2xl shadow-sm divide-y divide-stone-100">
        {messages.length === 0 && (
          <div className="p-8 text-center text-stone-400 text-xs">No messages</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => onSelect(msg)}
            className={`p-4 cursor-pointer transition-colors flex items-start gap-3.5 ${
              selectedMsg?.id === msg.id
                ? 'bg-emerald-50/60 border-l-2 border-emerald-600'
                : 'hover:bg-eco-bg/30'
            } ${!msg.read ? 'bg-[#10b981]/5' : ''}`}
          >
            {/* Direction indicator */}
            <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
              msg.direction === 'incoming' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {msg.direction === 'incoming'
                ? <ArrowDownLeft className="w-3.5 h-3.5" />
                : <ArrowUpRight className="w-3.5 h-3.5" />
              }
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-800">
                    {msg.from_name || msg.from_number}
                  </span>
                  {msg.message_type && msg.message_type !== 'text' && (
                    <span className="text-[8px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      {msg.message_type}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px] text-stone-400 shrink-0">
                  {new Date(msg.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-stone-400">{msg.instance_name || '—'}</span>
              </div>
            </div>

            {/* Unread dot */}
            {!msg.read && (
              <div className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}