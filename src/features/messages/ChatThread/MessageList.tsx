import { ChevronDown, MessageSquare } from 'lucide-react';
import type { ChatListItem, MirrorMessage } from '../messagesApi';
import MessageBubble from '../MessageBubble';
import type { Instance } from '../../../services/api';

interface DayGroup { key: string; label: string; messages: MirrorMessage[]; }

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return 'Today';
  if (day.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupByDay(messages: MirrorMessage[]): DayGroup[] {
  const out: DayGroup[] = [];
  for (const m of messages) {
    const label = dayLabel(m.timestamp);
    const last = out[out.length - 1];
    if (last && last.label === label) last.messages.push(m);
    else out.push({ key: label, label, messages: [m] });
  }
  return out;
}

interface MessageListProps {
  chat: ChatListItem;
  groups: DayGroup[];
  loading: boolean;
  error: string | null;
  messages: MirrorMessage[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  atBottom: boolean;
  onScroll: () => void;
  onScrollToBottom: () => void;
  instanceName?: string | null;
}

export default function MessageList({
  chat,
  groups,
  loading,
  error,
  messages,
  scrollRef,
  atBottom,
  onScroll,
  onScrollToBottom,
  instanceName,
}: MessageListProps) {
  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-auto px-3 py-3 md:px-5"
      >
        {loading && <p className="text-xs text-[#6e684a]">Loading messages…</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#6e684a]">
            <MessageSquare size={24} />
            <p className="text-xs">No messages in this chat yet</p>
          </div>
        )}
        <div>
          {groups.map((g) => (
            <div key={g.key}>
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-[#2d2813] px-3 py-0.5 text-[10px] font-medium text-[#6e684a]">{g.label}</span>
              </div>
              {g.messages.map((m, i) => {
                const prev = g.messages[i - 1];
                const next = g.messages[i + 1];
                const isContinuation = prev
                  && prev.direction === m.direction
                  && (chat?.isGroup ? prev.senderName === m.senderName : true)
                  && m.timestamp - prev.timestamp < 5 * 60 * 1000;
                const nextSender = next
                  && next.direction === m.direction
                  && (chat?.isGroup ? next.senderName === m.senderName : true);
                const isGroupEnd = !next || !nextSender || (next && next.timestamp - m.timestamp > 5 * 60 * 1000);
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isContinuation={isContinuation}
                    isGroupEnd={isGroupEnd}
                    instanceName={instanceName}
                    isGroup={chat.isGroup}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {!atBottom && (
        <button
          onClick={onScrollToBottom}
          aria-label="Scroll to latest"
          className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#181711] text-[#eab308] shadow-lg transition hover:opacity-90"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
}
