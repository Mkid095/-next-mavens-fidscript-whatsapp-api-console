import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { ClientMessage } from '../../services/api';
import MessageBubble from './MessageBubble';

interface MessageGroupListProps {
  groupedMessages: { date: string; messages: ClientMessage[] }[];
  selectedPhone: string;
  formatTime: (ts: string) => string;
  formatFullTime: (ts: string) => string;
  getStatusIcon: (msg: ClientMessage) => React.ReactNode;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onContextMenu: (e: React.MouseEvent, msgId: string) => void;
  onTouchStart: (e: React.TouchEvent, msgId: string) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export default function MessageGroupList({
  groupedMessages, selectedPhone,
  formatTime, formatFullTime, getStatusIcon, bottomRef,
  onContextMenu, onTouchStart, onTouchEnd
}: MessageGroupListProps) {
  if (groupedMessages.length === 0) {
    return (
      <div className="text-center text-stone-400 py-12 space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-yellow-200" />
        <p className="text-xs font-bold text-forest-deep">Start the conversation</p>
        <p className="text-[10px] text-graphite">Send a message to {selectedPhone}</p>
      </div>
    );
  }
  return (
    <>
      {groupedMessages.map((group, gi) => (
        <div key={gi}>
          <div className="flex items-center justify-center my-3">
            <span className="px-3 py-0.5 bg-white/80 backdrop-blur-sm rounded-full text-[9px] font-bold text-stone-500 shadow-sm border border-[#eaebe4]/50">{group.date}</span>
          </div>
          {group.messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              formatTime={formatTime}
              formatFullTime={formatFullTime}
              getStatusIcon={getStatusIcon}
              onContextMenu={onContextMenu}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </>
  );
}
