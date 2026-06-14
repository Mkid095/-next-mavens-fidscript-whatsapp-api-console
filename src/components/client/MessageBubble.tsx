import React from 'react';
import { MapPin, Paperclip, User, Zap, List } from 'lucide-react';
import type { ClientMessage } from '../../services/api';

interface MessageBubbleProps {
  msg: ClientMessage;
  formatTime: (ts: string) => string;
  formatFullTime: (ts: string) => string;
  getStatusIcon: (msg: ClientMessage) => React.ReactNode;
  onContextMenu: (e: React.MouseEvent, msgId: string) => void;
  onTouchStart: (e: React.TouchEvent, msgId: string) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export default function MessageBubble({
  msg, formatTime, formatFullTime, getStatusIcon,
  onContextMenu, onTouchStart, onTouchEnd
}: MessageBubbleProps) {
  return (
    <div
      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-1`}
      title={formatFullTime(msg.timestamp)}
      onContextMenu={e => onContextMenu(e, msg.id)}
      onTouchStart={e => onTouchStart(e, msg.id)}
      onTouchEnd={onTouchEnd}
      onTouchMove={e => {
        const el = e.currentTarget as HTMLElement;
        const timer = el.dataset.longPressTimer;
        if (timer) { clearTimeout(parseInt(timer)); delete el.dataset.longPressTimer; }
      }}
    >
      <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
        msg.direction === 'outgoing'
          ? 'bg-forest-deep text-white rounded-br-md'
          : 'bg-white border border-[#eaebe4] text-forest-deep rounded-bl-md'
      }`}>
        {msg.media_url && (
          msg.message_type === 'image' ? (
            <img src={msg.media_url} alt="media" className="rounded-xl w-52 h-52 object-cover mb-2" />
          ) : msg.message_type === 'video' ? (
            <video src={msg.media_url} controls className="rounded-xl w-52 mb-2" />
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4" />
              <a href={msg.media_url} target="_blank" rel="noreferrer" className="underline text-[10px]">View media</a>
            </div>
          )
        )}
        {msg.message_type === 'location' && (
          <div className="flex items-center gap-2 mb-2 text-[10px]">
            <MapPin className="w-4 h-4" />
            <span>Location</span>
          </div>
        )}
        {msg.message_type === 'contact' && (
          <div className="flex items-center gap-2 mb-2 text-[10px]">
            <User className="w-4 h-4" />
            <span>Contact: {msg.content}</span>
          </div>
        )}
        {msg.message_type === 'poll' && (
          <div className="flex items-center gap-2 mb-2 text-[10px]">
            <Zap className="w-4 h-4" />
            <span>Poll: {msg.content}</span>
          </div>
        )}
        {msg.message_type === 'list' && (
          <div className="flex items-center gap-2 mb-2 text-[10px]">
            <List className="w-4 h-4" />
            <span>List: {msg.content}</span>
          </div>
        )}
        {msg.message_type === 'reaction' && (
          <div className="text-lg">{msg.content}</div>
        )}
        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
        <div className={`flex items-center gap-1 mt-1.5 ${msg.direction === 'outgoing' ? 'justify-end' : ''}`}>
          <span className={`text-[9px] ${msg.direction === 'outgoing' ? 'text-white/50' : 'text-stone-400'}`}>
            {formatTime(msg.timestamp)}
          </span>
          {getStatusIcon(msg)}
        </div>
      </div>
    </div>
  );
}
