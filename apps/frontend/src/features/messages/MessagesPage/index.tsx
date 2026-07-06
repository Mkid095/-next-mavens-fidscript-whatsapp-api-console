import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Instance } from '../../../services/api';
import { useChatList } from '../useChatList';
import { useChatMessages } from '../useChatMessages';
import ChatListPane from '../ChatListPane';
import ChatThread from '../ChatThread';
import NewChatModal from '../NewChatModal';
import { messagesApi } from '../messagesApi';
import type { ChatListItem, MirrorMessage } from '../messagesApi';
import InstanceHeader from './InstanceHeader';
import SyncMessageBanner from './SyncMessageBanner';
import EmptyState from './EmptyState';
import NotLinkedState from './NotLinkedState';

interface MessagesPageProps {
  instances: Instance[];
  clientToken?: string;
}

function pickDefaultInstance(instances: Instance[]): Instance | null {
  return instances.find((i) => i.status === 'connected') ?? instances[0] ?? null;
}

export default function MessagesPage({ instances, clientToken }: MessagesPageProps) {
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

  useEffect(() => {
    if (!instance?.name || !selectedJid) return;
    messagesApi.markRead(instance.name, selectedJid).catch(() => { /* non-critical */ });
  }, [instance?.name, selectedJid]);

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

  if (instances.length === 0) return <EmptyState />;
  if (instance && instance.status !== 'connected') return <NotLinkedState instance={instance} />;

  const onSend = (optimistic: MirrorMessage) => {
    optimisticAppend(optimistic);
    void refreshChats();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2d2813] bg-[#181711] shadow-sm">
      <InstanceHeader
        instance={instance}
        instances={instances}
        syncState={syncState}
        onSwitchInstance={switchInstance}
        onSyncPhonebook={handleSyncPhonebook}
      />
      <SyncMessageBanner
        syncState={syncState}
        syncMessage={syncMessage}
        onDismiss={() => setSyncState('idle')}
      />
      <div className="flex min-h-0 flex-1">
        <ChatListPane
          chats={chats}
          loading={chatsLoading}
          error={chatsError}
          search={search}
          onSearchChange={setSearch}
          selectedJid={selectedJid}
          onSelect={(c) => setSelectedJid(c.jid)}
          onNewChat={() => setShowNewChat(true)}
          instanceName={instance?.name ?? ''}
          hiddenOnMobile={!!selectedJid}
          onRetry={() => void refreshChats()}
        />
        <ChatThread
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
