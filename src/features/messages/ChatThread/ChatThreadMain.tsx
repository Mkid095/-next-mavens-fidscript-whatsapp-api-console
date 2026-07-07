import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatListItem, MirrorMessage } from '../messagesApi';
import { messagesApi } from '../messagesApi';
import MessageComposer from '../MessageComposer';
import { useProfilePic } from '../useProfilePic';
import type { Instance } from '../../../services/api';
import ThreadHeader from './ThreadHeader';
import MessageList from './MessageList';

type ResumePolicy = 'manual' | 'next_message' | 'timeout';

// Extract lookup key for profile pic: phone digits for 1:1, full JID for groups.
function jidToPicLookupKey(jid: string): string | null {
  if (jid.includes('@g.us')) return jid;
  const user = jid.split('@')[0];
  return /^\d+$/.test(user) ? user : null;
}

interface ChatThreadProps {
  chat: ChatListItem | null;
  instance: Instance | null;
  messages: MirrorMessage[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onSend: (optimistic: MirrorMessage) => void;
  isMobileListVisible: boolean;
  clientToken?: string;
}

export default function ChatThread({ chat, instance, messages, loading, error, onBack, onSend, isMobileListVisible, clientToken }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [aiOverride, setAiOverride] = useState<'ai' | 'manual' | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [showTakeoverMenu, setShowTakeoverMenu] = useState(false);
  const [hasChatbot, setHasChatbot] = useState(false);

  const groups = useMemo(() => {
    const out: { key: string; label: string; messages: MirrorMessage[] }[] = [];
    for (const m of messages) {
      const d = new Date(m.timestamp);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const day = new Date(d); day.setHours(0, 0, 0, 0);
      let label: string;
      if (day.getTime() === today.getTime()) label = 'Today';
      else if (day.getTime() === yesterday.getTime()) label = 'Yesterday';
      else label = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      const last = out[out.length - 1];
      if (last && last.label === label) last.messages.push(m);
      else out.push({ key: label, label, messages: [m] });
    }
    return out;
  }, [messages]);

  useEffect(() => {
    setShowTakeoverMenu(false);
    setHasChatbot(false);
    if (!chat?.jid || !clientToken) { setAiOverride(null); return; }
    setOverrideLoading(true);
    messagesApi.getAiOverride(chat.jid)
      .then((res) => {
        if (res.success && res.data) {
          setAiOverride(res.data.mode);
          setHasChatbot(res.data.hasChatbot ?? false);
        } else {
          setAiOverride(null);
        }
      })
      .catch(() => setAiOverride(null))
      .finally(() => setOverrideLoading(false));
  }, [chat?.jid, clientToken]);

  const handleTakeOver = useCallback(async (policy: ResumePolicy) => {
    if (!chat?.jid || !clientToken || overrideLoading) return;
    setShowTakeoverMenu(false);
    setOverrideLoading(true);
    try {
      const opts: { resumePolicy: ResumePolicy; expiresAt?: string } = { resumePolicy: policy };
      if (policy === 'timeout') {
        opts.expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }
      const res = await messagesApi.takeOver(chat.jid, opts);
      if (res.success) setAiOverride('manual');
    } finally {
      setOverrideLoading(false);
    }
  }, [chat?.jid, clientToken, overrideLoading]);

  const handleResumeAi = useCallback(async () => {
    if (!chat?.jid || !clientToken || overrideLoading) return;
    setOverrideLoading(true);
    try {
      const res = await messagesApi.resumeAi(chat.jid);
      if (res.success) setAiOverride('ai');
    } finally {
      setOverrideLoading(false);
    }
  }, [chat?.jid, clientToken, overrideLoading]);

  useEffect(() => {
    if (!showTakeoverMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-takeover-menu]')) setShowTakeoverMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTakeoverMenu]);

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

  const visibility = isMobileListVisible ? 'hidden md:flex' : 'flex';
  const headerPicKey = chat ? jidToPicLookupKey(chat.jid) : null;
  const headerPic = useProfilePic(instance?.name ?? null, headerPicKey);

  return (
    <div className={`${visibility} h-full min-h-0 min-w-0 flex-1 flex-col bg-[#181711]`}>
      {chat ? (
        <>
          <ThreadHeader
            chat={chat}
            headerPic={headerPic ?? null}
            onBack={onBack}
            showTakeoverMenu={showTakeoverMenu}
            setShowTakeoverMenu={setShowTakeoverMenu}
            aiOverride={aiOverride}
            hasChatbot={hasChatbot}
            overrideLoading={overrideLoading}
            handleTakeOver={handleTakeOver}
            handleResumeAi={handleResumeAi}
          />

          <MessageList
            chat={chat}
            groups={groups}
            loading={loading}
            error={error}
            messages={messages}
            scrollRef={scrollRef}
            atBottom={atBottom}
            onScroll={handleScroll}
            onScrollToBottom={scrollToBottom}
            instanceName={instance?.name}
          />

          <MessageComposer
            chatJid={chat.jid}
            instance={instance}
            onSent={onSend}
            locked={chat.isGroup && chat.isRestricted && !chat.isAdmin}
          />
        </>
      ) : (
        <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 text-[#6e684a]">
          <MessageSquare size={32} />
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
}
