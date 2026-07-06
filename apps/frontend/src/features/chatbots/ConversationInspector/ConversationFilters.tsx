import React from 'react';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import type { Conversation } from './types';
import { formatRelative } from './utils';

interface Props {
  conversations: Conversation[];
  selectedConvId: string | null;
  loadingConv: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectConv: (id: string) => void;
}

export default function ConversationFilters({
  conversations,
  selectedConvId,
  loadingConv,
  searchQuery,
  onSearchChange,
  onSelectConv,
}: Props) {
  return (
    <div className="w-64 shrink-0 border-r border-[#2d2813] flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-[#2d2813]">
        <div className="flex items-center gap-2 bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-[#6e684a] shrink-0" />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search customers…"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-[#5a554a] outline-none"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="text-[#5a554a] hover:text-white text-xs">✕</button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loadingConv ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[#6e684a]" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#3d3813]" />
            <p className="text-xs text-[#6e684a]">No conversations found</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.conversationId}
              onClick={() => onSelectConv(conv.conversationId)}
              className={`w-full text-left px-3 py-3 border-b border-[#2d2813] hover:bg-[#1a1915] transition ${
                selectedConvId === conv.conversationId ? 'bg-[#1a1915] border-l-2 border-l-yellow-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-yellow-400">
                    {(conv.customerName || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{conv.customerName || 'Unknown'}</p>
                  </div>
                  <p className="text-[10px] text-[#6e684a] truncate">{conv.customerNumber}</p>
                </div>
                <div className="text-[9px] text-[#5a554a] shrink-0">{formatRelative(conv.lastMessageAt)}</div>
              </div>
              <p className="text-[10px] text-[#6e684a] mt-1 truncate pl-10">{conv.lastMessage}</p>
              <div className="flex items-center gap-2 mt-1 pl-10">
                <span className="text-[9px] text-[#5a554a]">{conv.messageCount} msgs</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
