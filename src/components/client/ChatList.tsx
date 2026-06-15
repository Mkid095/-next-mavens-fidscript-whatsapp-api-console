import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import type { ClientMessage } from '../../services/api';

interface ConversationContact {
  chatId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  instanceName: string;
  isGroup: boolean;
}

interface ChatListProps {
  contacts: ConversationContact[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
  formatTime: (ts: string) => string;
}

export default function ChatList({ contacts, selectedPhone, onSelect, formatTime }: ChatListProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 space-y-3 bg-[#fafaf5]">
        <MessageSquare className="w-12 h-12 text-yellow-200" />
        <div className="text-center">
          <p className="font-bold text-forest-deep text-sm">No conversations yet</p>
          <p className="text-xs text-graphite mt-1">Incoming messages will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {contacts.map(contact => (
        <button
          key={contact.chatId}
          onClick={() => onSelect(contact.chatId)}
          className={`w-full p-3 flex items-start gap-2.5 hover:bg-stone-100 transition-all text-left border-b border-[#eaebe4]/40 ${
            selectedPhone === contact.chatId ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
            {contact.isGroup
              ? <Users className="w-5 h-5" />
              : (contact.name || contact.chatId).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-deep truncate">{contact.name || contact.chatId}</span>
              <span className="text-[9px] text-stone-400 shrink-0 ml-1">{formatTime(contact.lastTime)}</span>
            </div>
            <p className="text-[10px] text-stone-500 font-mono truncate">{contact.isGroup ? 'Group' : contact.chatId}</p>
            <p className="text-[10px] text-stone-400 truncate mt-0.5">{contact.lastMessage}</p>
          </div>
          {contact.unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {contact.unread > 9 ? '9+' : contact.unread}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
