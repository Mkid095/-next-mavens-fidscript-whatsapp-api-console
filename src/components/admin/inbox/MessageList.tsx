import React from 'react';
import { InboxMessage } from '../../../types';
import { Mail, MailOpen, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface MessageListProps {
  messages: InboxMessage[];
  selectedMsg: InboxMessage | null;
  onSelect: (msg: InboxMessage) => void;
}

export default function MessageList({ messages, selectedMsg, onSelect }: MessageListProps) {
  return (
    <div className="space-y-3">
      <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d]">
        Webhook Events
      </span>

      <div className="divide-y divide-stone-100 border border-[#e1e9e5]/80 bg-white rounded-3xl shadow-sm overflow-hidden">
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
            } ${!msg.read ? 'bg-[#10b981]/5 font-semibold' : ''}`}
          >
            {/* Direction indicator */}
            <div className={`mt-1 shrink-0 p-2 rounded-xl ${
              msg.direction === 'incoming' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {msg.direction === 'incoming'
                ? <ArrowDownLeft className="w-4 h-4" />
                : <ArrowUpRight className="w-4 h-4" />
              }
            </div>

            <div className="flex-1 space-y-1 min-w-0 font-sans">
              <div className="flex items-center justify-between gap-2 text-[10px] text-graphite">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-emerald-800">
                    {msg.from_name || msg.from_number}
                  </span>
                  {msg.message_type && msg.message_type !== 'text' && (
                    <span className="text-[8px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      {msg.message_type}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px]">{new Date(msg.timestamp).toLocaleDateString()}</span>
              </div>

              <h3 className="text-xs font-bold text-forest-deep truncate">{msg.content?.substring(0, 50) || '(no content)'}</h3>
              <p className="text-[11px] text-[#4d6458] truncate">{msg.content}</p>
            </div>

            {/* Unread dot */}
            {!msg.read && (
              <div className="shrink-0 mt-2 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}