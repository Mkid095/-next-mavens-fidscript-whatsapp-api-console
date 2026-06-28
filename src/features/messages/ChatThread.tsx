import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MessageSquare, Users } from 'lucide-react';
import type { ChatListItem, MirrorMessage } from './messagesApi';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import type { Instance } from '../../services/api';

// A single group of messages that share a calendar day, for date separators.
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

interface ChatThreadProps {
  chat: ChatListItem | null;
  instance: Instance | null;
  messages: MirrorMessage[];
  loading: boolean;
  error: string | null;
  onBack: () => void;        // mobile: return to list
  onSend: (optimistic: MirrorMessage) => void;
  isMobileListVisible: boolean;
}

// Right pane — pinned header + independently scrollable thread + pinned
// composer. The scroll region + scroll-to-bottom FAB share a `relative`
// ancestor so the FAB anchors correctly (fixing the old bug).
export default function ChatThread({ chat, instance, messages, loading, error, onBack, onSend, isMobileListVisible }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const groups = useMemo(() => groupByDay(messages), [messages]);

  // Auto-scroll to bottom when messages change AND user is already at bottom.
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, atBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setAtBottom(true);
  };

  // Mobile: hide thread when list is visible.
  const visibility = isMobileListVisible ? 'hidden md:flex' : 'flex';

  return (
    <div className={`${visibility} h-full min-h-0 min-w-0 flex-1 flex-col bg-stone-50`}>
      {chat ? (
        <>
          <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-3 py-2.5 md:px-4">
            <button
              onClick={onBack}
              aria-label="Back to chats"
              className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 md:hidden"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-stone-600">
              {chat.isGroup ? <Users size={16} /> : <span className="text-xs font-semibold">{(chat.name || chat.jid).slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-stone-800">{chat.name}</h2>
              <p className="truncate text-[11px] text-stone-400">{chat.isGroup ? 'Group · ' + chat.jid : chat.jid}</p>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto px-3 py-3 md:px-5"
            >
              {loading && <p className="text-xs text-stone-400">Loading messages…</p>}
              {error && <p className="text-xs text-red-600">{error}</p>}
              {!loading && !error && messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
                  <MessageSquare size={24} />
                  <p className="text-xs">No messages in this chat yet</p>
                </div>
              )}
              <div>
                {groups.map((g) => (
                  <div key={g.key}>
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-stone-200/70 px-3 py-0.5 text-[10px] font-medium text-stone-500">{g.label}</span>
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
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {!atBottom && (
              <button
                onClick={scrollToBottom}
                aria-label="Scroll to latest"
                className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#181711] text-[#eab308] shadow-lg transition hover:opacity-90"
              >
                <ChevronDown size={18} />
              </button>
            )}
          </div>

          <MessageComposer
            chatJid={chat.jid}
            instance={instance}
            onSent={onSend}
          />
        </>
      ) : (
        <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 text-stone-400">
          <MessageSquare size={32} />
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
}
