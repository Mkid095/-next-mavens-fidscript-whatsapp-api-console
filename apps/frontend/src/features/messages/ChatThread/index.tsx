/* ChatThread/index.tsx — Thin shell: owns chat state, AI override, renders layout */
import { useCallback, useEffect, useState } from 'react';
import type { ChatListItem, MirrorMessage } from '../messagesApi';
import { messagesApi } from '../messagesApi';
import MessageComposer from '../MessageComposer/index';
import { useProfilePic } from '../useProfilePic';
import type { Instance } from '../../../services/api';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatEmptyThread } from './ChatEmptyThread';
import { AiControlBar, type ResumePolicy } from './AiControlBar';

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

export default function ChatThread({
  chat, instance, messages, loading, error, onBack, onSend, isMobileListVisible, clientToken,
}: ChatThreadProps) {
  const [aiOverride, setAiOverride] = useState<'ai' | 'manual' | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [showTakeoverMenu, setShowTakeoverMenu] = useState(false);
  const [hasChatbot, setHasChatbot] = useState(false);

  const headerPicKey = chat ? jidToPicLookupKey(chat.jid) : null;
  const headerPic = useProfilePic(instance?.name ?? null, headerPicKey);
  const visibility = isMobileListVisible ? 'hidden md:flex' : 'flex';

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
        } else { setAiOverride(null); }
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
      if (policy === 'timeout') opts.expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const res = await messagesApi.takeOver(chat.jid, opts);
      if (res.success) setAiOverride('manual');
    } finally { setOverrideLoading(false); }
  }, [chat?.jid, clientToken, overrideLoading]);

  const handleResumeAi = useCallback(async () => {
    if (!chat?.jid || !clientToken || overrideLoading) return;
    setOverrideLoading(true);
    try {
      const res = await messagesApi.resumeAi(chat.jid);
      if (res.success) setAiOverride('ai');
    } finally { setOverrideLoading(false); }
  }, [chat?.jid, clientToken, overrideLoading]);

  useEffect(() => {
    if (!showTakeoverMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-takeover-menu]')) setShowTakeoverMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTakeoverMenu]);

  return (
    <div className={`${visibility} h-full min-h-0 min-w-0 flex-1 flex-col bg-[#181711]`}>
      {chat ? (
        <>
          <ChatHeader chat={chat} headerPic={headerPic} onBack={onBack} isMobile />

          {clientToken && (
            <AiControlBar
              aiOverride={aiOverride} hasChatbot={hasChatbot} isGroup={chat.isGroup}
              overrideLoading={overrideLoading} showTakeoverMenu={showTakeoverMenu}
              onTakeOver={handleTakeOver} onResumeAi={handleResumeAi}
              onToggleMenu={() => setShowTakeoverMenu(v => !v)}
            />
          )}

          {/* Messages */}
          <ChatMessageList
            messages={messages} loading={loading} error={error}
            isGroup={chat.isGroup} instanceName={instance?.name}
          />

          <MessageComposer chatJid={chat.jid} instance={instance} onSent={onSend}
            locked={chat.isGroup && chat.isRestricted && !chat.isAdmin} />
        </>
      ) : (
        <ChatEmptyThread />
      )}
    </div>
  );
}
