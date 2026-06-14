import React from 'react';
import { MessageSquare, PenSquare } from 'lucide-react';

export default function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#fafaf5]">
      <div className="text-center space-y-4 max-w-xs">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-forest-deep">Welcome to Messages</h3>
          <p className="text-xs text-graphite mt-1">Select a conversation from the list or start a new chat to begin.</p>
        </div>
        <button
          onClick={onNewChat}
          className="px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all inline-flex items-center gap-2"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Start New Chat
        </button>
      </div>
    </div>
  );
}
