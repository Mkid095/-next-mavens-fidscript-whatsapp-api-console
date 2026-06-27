import { useMemo, useState } from 'react';
import { MessageSquare, PenSquare, Search } from 'lucide-react';
import type { ChatListItem } from './messagesApi';
import ChatRow from './ChatRow';

interface ChatListPaneProps {
  chats: ChatListItem[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (q: string) => void;
  selectedJid: string | null;
  onSelect: (chat: ChatListItem) => void;
  onNewChat: () => void;
  instanceName: string;
  hiddenOnMobile?: boolean;
}

// Left pane — search + new-chat + independently scrollable list. The scroll
// region uses min-h-0 flex-1 overflow-y-auto inside a flex column so the page
// never scrolls itself (the parent owns the viewport height).
export default function ChatListPane({
  chats, loading, error, search, onSearchChange,
  selectedJid, onSelect, onNewChat, instanceName, hiddenOnMobile,
}: ChatListPaneProps) {
  const [local, setLocal] = useState(search);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.name.toLowerCase().includes(q) || c.jid.toLowerCase().includes(q));
  }, [chats, search]);

  return (
    <div className={`${hiddenOnMobile ? 'hidden md:flex' : 'flex'} h-full min-h-0 w-full flex-col border-r border-stone-200 bg-white md:w-[340px] md:shrink-0`}>
      <div className="flex items-center gap-2 p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 focus-within:border-[#eab308]">
          <Search size={14} className="text-stone-400" />
          <input
            value={local}
            onChange={(e) => { setLocal(e.target.value); onSearchChange(e.target.value); }}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
          />
        </div>
        <button
          onClick={onNewChat}
          aria-label="New chat"
          title="Start a chat with a saved contact"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#181711] text-[#eab308] transition hover:opacity-90"
        >
          <PenSquare size={15} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && chats.length === 0 && <p className="p-4 text-xs text-stone-400">Loading chats…</p>}
        {error && <p className="p-4 text-xs text-red-600">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-stone-400">
            <MessageSquare size={24} />
            <p className="text-xs">{chats.length === 0 ? 'No chats on this instance yet' : 'No chats match your search'}</p>
          </div>
        )}
        {filtered.map((c) => (
          <ChatRow
            key={c.jid}
            chat={c}
            instanceName={instanceName}
            selected={c.jid === selectedJid}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
