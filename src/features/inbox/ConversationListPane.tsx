import { Search, MessageSquare, PenSquare } from 'lucide-react';
import type { Conversation } from '../../data';
import ConversationListItem from './ConversationListItem';
import QueueFilter, { type QueueKey } from './QueueFilter';

// Left pane — PRESENTATIONAL. The data lives in InboxPage (single source of
// truth) so the selected conversation stays fresh after a drawer update.
interface ConversationListPaneProps {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  queue: QueueKey;
  onQueueChange: (q: QueueKey) => void;
  search: string;
  onSearchChange: (q: string) => void;
  selectedId: string | null;
  onSelect: (c: Conversation) => void;
  onNewChat: () => void;
}

export default function ConversationListPane({
  conversations, loading, error, queue, onQueueChange, search, onSearchChange, selectedId, onSelect, onNewChat,
}: ConversationListPaneProps) {
  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
            <Search size={15} className="text-stone-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations"
              className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
            />
          </div>
          <button
            onClick={onNewChat}
            aria-label="New chat"
            title="New chat with a saved contact"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-forest-deep text-white transition hover:opacity-90"
          >
            <PenSquare size={15} />
          </button>
        </div>
      </div>
      <QueueFilter active={queue} onChange={onQueueChange} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 && <p className="p-4 text-xs text-stone-400">Loading…</p>}
        {error && <p className="p-4 text-xs text-red-600">{error}</p>}
        {!loading && !error && conversations.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-stone-400">
            <MessageSquare size={24} />
            <p className="text-xs">No conversations in this queue</p>
          </div>
        )}
        {conversations.map((c) => (
          <ConversationListItem
            key={c.id}
            conversation={c}
            selected={c.id === selectedId}
            onSelect={() => onSelect(c)}
          />
        ))}
      </div>
    </div>
  );
}
