import React from 'react';
import { MessageSquare } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-[#6e684a]">
      <MessageSquare size={24} />
      <p className="text-xs">No messages in this chat yet</p>
    </div>
  );
}
