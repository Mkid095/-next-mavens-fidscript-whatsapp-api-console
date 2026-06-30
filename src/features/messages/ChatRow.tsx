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

// Pull the phone digits out of a 1:1 JID for the avatar/profile-pic lookup.
// Group JIDs (@g.us) don't have a numeric phone so we fall back to the subject.
function jidToPicNumber(jid: string): string | null {
  if (jid.includes('@g.us')) return null;
  const user = jid.split('@')[0];
  return /^\d+$/.test(user) ? user : null;
}

export default function ChatRow({ chat, instanceName, selected, onSelect }: ChatRowProps) {
  const picNumber = jidToPicNumber(chat.jid);
  const pic = useProfilePic(instanceName, picNumber);
  const initials = (chat.name || chat.jid).slice(0, 2).toUpperCase();

  return (
    <button
      onClick={() => onSelect(chat)}
      className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition ${
        selected ? 'border-[#25D366] bg-[#181711]/[0.04]' : 'border-transparent hover:bg-stone-100'
      }`}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200 text-stone-600">
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
            <span className={`truncate text-sm font-semibold ${chat.unread > 0 ? 'text-stone-900 font-bold' : 'text-stone-800'}`}>{chat.name}</span>
          </span>
          <span className="shrink-0 text-[10px] text-stone-400">{timeAgo(chat.lastMessageAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-xs ${chat.unread > 0 ? 'text-stone-700 font-medium' : 'text-stone-500'}`}>
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
