import React from 'react';
import { MessageSquare } from 'lucide-react';

export function ChatEmptyThread() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 text-[#6e684a]">
      <MessageSquare size={32} />
      <p className="text-sm">Select a chat to start messaging</p>
    </div>
  );
}
