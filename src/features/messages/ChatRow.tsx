import { Users } from 'lucide-react';
import type { ChatListItem } from './messagesApi';
import { useProfilePic } from './useProfilePic';

interface ChatRowProps {
  chat: ChatListItem;
  instanceName: string;
  selected: boolean;
  onSelect: (chat: ChatListItem) => void;
}

function timeAgo(ts: number | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Extract the lookup key for profile pic fetch:
// - 1:1 JID → phone digits (e.g. 254712345678) for fetchProfilePictureUrl
// - Group JID → full JID (e.g. 123456789-987654321@g.us) — passed directly to Evolution API
function jidToPicLookupKey(jid: string): string | null {
  if (jid.includes('@g.us')) return jid; // full group JID for group pic lookup
  const user = jid.split('@')[0];
  return /^\d+$/.test(user) ? user : null;
}

export default function ChatRow({ chat, instanceName, selected, onSelect }: ChatRowProps) {
  const picLookupKey = jidToPicLookupKey(chat.jid);
  const pic = useProfilePic(instanceName, picLookupKey);
  const initials = (chat.name || chat.jid).slice(0, 2).toUpperCase();

  return (
    <button
      onClick={() => onSelect(chat)}
      className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition ${
        selected ? 'border-[#25D366] bg-[#25D366]/10' : 'border-transparent hover:bg-[#2d2813]'
      }`}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2d2813] text-[#8f834a]">
        {pic ? (
          <img src={pic} alt="" className="h-full w-full object-cover" />
        ) : chat.isGroup ? (
          <Users size={18} />
        ) : (
          <span className="text-xs font-semibold">{initials}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {chat.aiMode === 'manual' && (
              <span title="AI paused — agent manually handling" className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            )}
            {chat.aiMode === 'ai' && (
              <span title="AI active" className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-400" />
            )}
            <span className={`truncate text-sm font-semibold ${chat.unread > 0 ? 'text-white font-bold' : 'text-[#a8a99e]'}`}>{chat.name}</span>
          </span>
          <span className="shrink-0 text-[10px] text-[#6e684a]">{timeAgo(chat.lastMessageAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-xs ${chat.unread > 0 ? 'text-[#a8a99e] font-medium' : 'text-[#6e684a]'}`}>
            {chat.lastMessage || (chat.isGroup ? 'Group' : 'No messages yet')}
          </span>
          {chat.unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] px-1 text-[10px] font-bold text-white shadow-sm">
              {chat.unread > 99 ? '99+' : chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
