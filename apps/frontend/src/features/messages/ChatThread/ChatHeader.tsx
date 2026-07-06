import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';

interface ChatHeaderProps {
  chat: { name?: string; jid: string; isGroup: boolean };
  headerPic: string | null;
  onBack: () => void;
  isMobile: boolean;
}

export function ChatHeader({ chat, headerPic, onBack, isMobile }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[#2d2813] bg-[#181711] px-3 py-2.5 md:px-4">
      {isMobile && (
        <button onClick={onBack} aria-label="Back to chats" className="rounded-lg p-1 text-[#8f834a] hover:bg-[#2d2813]">
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2d2813] overflow-hidden text-[#8f834a]">
        {headerPic ? (
          <img src={headerPic} alt="" className="h-full w-full object-cover" />
        ) : chat.isGroup ? (
          <Users size={16} />
        ) : (
          <span className="text-xs font-semibold">{(chat.name || chat.jid).slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-white">{chat.name}</h2>
        <p className="truncate text-[11px] text-[#6e684a]">{chat.isGroup ? 'Group · ' + chat.jid : chat.jid}</p>
      </div>
    </div>
  );
}
