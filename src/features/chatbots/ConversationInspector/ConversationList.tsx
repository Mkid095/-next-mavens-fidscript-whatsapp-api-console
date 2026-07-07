import React from 'react';
import { AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { formatRelative } from './helpers';

interface Conversation {
  conversationId: string;
  customerName: string;
  customerNumber: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  lowConfidence: boolean;
  wasEscalated: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  loadingConv: boolean;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, selectedConvId, loadingConv, onSelect }: ConversationListProps) {
  return (
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
            onClick={() => onSelect(conv.conversationId)}
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
                  {(conv.lowConfidence || conv.wasEscalated) && (
                    <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-[#6e684a] truncate">{conv.customerNumber}</p>
              </div>
              <div className="text-[9px] text-[#5a554a] shrink-0">{formatRelative(conv.lastMessageAt)}</div>
            </div>
            <p className="text-[10px] text-[#6e684a] mt-1 truncate pl-10">{conv.lastMessage}</p>
            <div className="flex items-center gap-2 mt-1 pl-10">
              <span className="text-[9px] text-[#5a554a]">{conv.messageCount} msgs</span>
              {conv.unreadCount > 0 && (
                <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-bold">{conv.unreadCount}</span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
