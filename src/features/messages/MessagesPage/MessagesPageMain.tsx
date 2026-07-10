import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Inbox, Link2Off } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Instance } from '../../../services/api';
import { useChatList } from '../useChatList';
import { useChatMessages } from '../useChatMessages';
import ChatThread from '../ChatThread';
import NewChatModal from '../NewChatModal';
import { messagesApi } from '../messagesApi';
import type { ChatListItem } from '../messagesApi';
import ChatListSection from './ChatList';

// MessagesPage — WhatsApp-Web 2-pane shell. Owns the selected instance and
// the selected chat. Container switching fully resets the thread so chats
// never bleed across instances.

interface MessagesPageProps {
  instances: Instance[];
  clientToken?: string;
}

function pickDefaultInstance(instances: Instance[]): Instance | null {
  return instances.find((i) => i.status === 'connected') ?? instances[0] ?? null;
}

export default function MessagesPageMain({ instances, clientToken }: MessagesPageProps) {
  const [instance, setInstance] = useState<Instance | null>(() => pickDefaultInstance(instances));
  const [search, setSearch] = useState('');
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  useEffect(() => {
    if (!instance) { setInstance(pickDefaultInstance(instances)); return; }
    const stillThere = instances.find((i) => i.id === instance.id);
    if (!stillThere) { setSelectedJid(null); setInstance(pickDefaultInstance(instances)); }
  }, [instances, instance]);

  const switchInstance = useCallback((next: Instance | null) => {
    setSelectedJid(null);
    setSyncState('idle');
    setSyncMessage('');
    setInstance(next);
  }, []);

  const { chats, loading: chatsLoading, error: chatsError, refresh: refreshChats } = useChatList(instance?.name ?? null, selectedJid);
  const { messages, loading: msgLoading, error: msgError, optimisticAppend } = useChatMessages(instance?.name ?? null, selectedJid);

  // Mark chat as read when it is opened — only if there are unread messages
  const prevUnreadRef = useRef(0);
  useEffect(() => {
    if (!instance?.name || !selectedJid) return;
    if (prevUnreadRef.current > 0) {
      messagesApi.markRead(instance.name, selectedJid).catch(() => { /* non-critical */ });
    }
    // Update ref for next call
    const chat = chats.find((c) => c.jid === selectedJid);
    prevUnreadRef.current = chat?.unread ?? 0;
  }, [instance?.name, selectedJid, chats]);

  const selected = useMemo<ChatListItem | null>(() => {
    if (!selectedJid) return null;
    return chats.find((c) => c.jid === selectedJid) ?? {
      jid: selectedJid, name: selectedJid, isGroup: selectedJid.includes('@g.us'),
      lastMessage: '', lastMessageAt: null, unread: 0, profilePic: null, aiMode: null, isRestricted: false, isAdmin: false,
    };
  }, [chats, selectedJid]);

  const handleSyncPhonebook = useCallback(async () => {
    if (!instance || syncState === 'syncing') return;
    setSyncState('syncing');
    setSyncMessage('');
    const res = await messagesApi.syncPhonebook(instance.name);
    if (res.success && res.data) {
      setSyncState('done');
      setSyncMessage(`Synced ${res.data.synced} contacts (${res.data.removed} removed)`);
      void refreshChats();
      setTimeout(() => setSyncState('idle'), 4000);
    } else {
      setSyncState('error');
      setSyncMessage(res.error || 'Sync failed');
      setTimeout(() => setSyncState('idle'), 6000);
    }
  }, [instance, syncState, refreshChats]);

  if (instances.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[#181711] text-[#6e684a]">
        <div className="text-center">
          <Inbox size={32} className="mx-auto mb-2" />
          <p className="text-sm">No WhatsApp instances yet</p>
          <p className="text-xs">Create and connect one to start chatting.</p>
        </div>
      </div>
    );
  }

  const isNotLinked = instance != null && instance.status !== 'connected';
  const navigate = useNavigate();

  if (isNotLinked) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[#181711]">
        <div className="text-center max-w-xs">
          <Link2Off size={40} className="mx-auto mb-3 text-[#6e684a]" />
          <h2 className="text-base font-semibold text-[#a8a99e] mb-1">
            {instance.name} is not linked
          </h2>
          <p className="text-xs text-[#6e684a] mb-5">
            This container has no WhatsApp account connected. Scan a QR code to link it.
          </p>
          <button
            onClick={() => navigate('/client/whatsapp')}
            className="rounded-lg bg-[#eab308] px-4 py-2 text-sm font-medium text-black hover:bg-[#fde047] transition"
          >
            Go to Containers
          </button>
        </div>
      </div>
    );
  }

  const onSend = (optimistic: import('../messagesApi').MirrorMessage) => {
    optimisticAppend(optimistic);
    void refreshChats();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2d2813] bg-[#181711] shadow-sm">
      <ChatListSection
        instances={instances}
        chats={chats}
        chatsLoading={chatsLoading}
        chatsError={chatsError}
        onSwitchInstance={switchInstance}
        selectedJid={selectedJid}
        onSelectJid={setSelectedJid}
        onNewChat={() => setShowNewChat(true)}
        instance={instance}
        syncState={syncState}
        syncMessage={syncMessage}
        onSyncPhonebook={handleSyncPhonebook}
        onRefreshChats={refreshChats}
        search={search}
        onSearchChange={setSearch}
        onDismissSync={() => setSyncState('idle')}
      />

      <div className="flex min-h-0 flex-1">
        <ChatThread
          key={selectedJid ?? 'none'}
          chat={selected}
          instance={instance}
          messages={messages}
          loading={msgLoading}
          error={msgError}
          isMobileListVisible={!selectedJid}
          onBack={() => setSelectedJid(null)}
          onSend={onSend}
          clientToken={clientToken}
        />
      </div>

      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPick={(c) => setSelectedJid(c.jid)}
      />
    </div>
  );
}
