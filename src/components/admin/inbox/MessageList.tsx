import React from 'react';
import { InboxMessage } from '../../../types';
import { Mail, MailOpen } from 'lucide-react';

interface MessageListProps {
  messages: InboxMessage[];
  selectedMsg: InboxMessage | null;
  onSelect: (msg: InboxMessage) => void;
}

export default function MessageList({ messages, selectedMsg, onSelect }: MessageListProps) {
  return (
    <div className="space-y-3">
      <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d]">
        Secure Payload Inbox
      </span>

      <div className="divide-y divide-stone-100 border border-[#e1e9e5]/80 bg-white rounded-3xl shadow-sm overflow-hidden">
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
            <div className="mt-1 shrink-0 bg-[#f0f4f2] p-2 rounded-xl text-emerald-700">
              {msg.read ? (
                <MailOpen className="w-4 h-4 text-[#5c7266]" />
              ) : (
                <Mail className="w-4 h-4 text-emerald-600 animate-pulse" />
              )}
            </div>

            <div className="flex-1 space-y-1 min-w-0 font-sans">
              <div className="flex items-center justify-between gap-2 text-[10px] text-graphite">
                <span className="font-bold uppercase tracking-wider text-emerald-800">
                  {msg.from_name || msg.from_number}
                </span>
                <span className="font-mono text-[9px]">{new Date(msg.timestamp).toLocaleDateString()}</span>
              </div>

              <h3 className="text-xs font-bold text-forest-deep truncate">{msg.content.substring(0, 50)}</h3>
              <p className="text-[11px] text-[#4d6458] truncate">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
