import { useCallback, useEffect, useMemo, useState } from 'react';
import { Inbox, Users, RefreshCw, Link2Off } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Instance } from '../../services/api';
import { useChatList } from './useChatList';
import { useChatMessages } from './useChatMessages';
import ChatListPane from './ChatListPane';
import ChatThread from './ChatThread';
import NewChatModal from './NewChatModal';
import OutboundUsageIndicator from './OutboundUsageIndicator';
import { messagesApi } from './messagesApi';
import type { ChatListItem } from './messagesApi';

// MessagesPage — WhatsApp-Web 2-pane shell. Owns the selected instance and
// the selected chat. Container switching fully resets the thread so chats
// never bleed across instances. Reads are debounced + capped (10/sec
// backend) and outbound volume is tracked + displayed (Tier 0 = 250/day).

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

  const { chats, loading: chatsLoading, error: chatsError, refresh: refreshChats } = useChatList(instance?.name ?? null);
  const { messages, loading: msgLoading, error: msgError, optimisticAppend } = useChatMessages(instance?.name ?? null, selectedJid);

  // Mark chat as read when it is opened — clears the unread badge in real time
  useEffect(() => {
    if (!instance?.name || !selectedJid) return;
    messagesApi.markRead(instance.name, selectedJid).catch(() => { /* non-critical */ });
  }, [instance?.name, selectedJid]);

  const selected = useMemo<ChatListItem | null>(() => {
    if (!selectedJid) return null;
    return chats.find((c) => c.jid === selectedJid) ?? {
      jid: selectedJid, name: selectedJid, isGroup: selectedJid.includes('@g.us'),
      lastMessage: '', lastMessageAt: null, unread: 0, profilePic: null, aiMode: null,
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

  // Show a clear "not linked" state when the selected container has no WhatsApp linked.
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

  const onSend = (optimistic: import('./messagesApi').MirrorMessage) => {
    optimisticAppend(optimistic);
    void refreshChats();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#2d2813] bg-[#181711] shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d2813] bg-[#1a1915] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-[#eab308]" />
          <h1 className="text-sm font-semibold text-white">Messages</h1>
          {instance && instance.status !== 'connected' && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              {instance.status}
            </span>
          )}
          <OutboundUsageIndicator instanceName={instance?.name ?? null} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleSyncPhonebook()}
            disabled={!instance || instance.status !== 'connected' || syncState === 'syncing'}
            title="Sync WhatsApp phonebook (one-way: pulls contacts into your saved list)"
            className="flex items-center gap-1 rounded-lg border border-[#2d2813] bg-[#1a1915] px-2 py-1 text-[11px] text-[#a8a99e] transition hover:bg-[#2d2813] disabled:opacity-50"
          >
            <Users size={12} className={syncState === 'syncing' ? 'animate-pulse' : ''} />
            {syncState === 'syncing' ? 'Syncing…' : 'Sync contacts'}
          </button>
          {instances.length > 1 && (
            <select
              value={instance?.id ?? ''}
              onChange={(e) => switchInstance(instances.find((i) => i.id === e.target.value) ?? null)}
              className="appearance-none rounded-lg border border-[#2d2813] bg-[#1a1915] px-2.5 py-1.5 pr-7 text-xs text-[#a8a99e] outline-none focus:border-[#eab308]"
            >
              {instances.map((i) => (
                <option key={i.id} value={i.id} style={{ background: '#1a1915', color: '#a8a99e' }}>{i.name}{i.status === 'connected' ? ' · connected' : ''}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {syncMessage && (
        <div className={`border-b px-4 py-1.5 text-[11px] ${
          syncState === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : syncState === 'done' ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-[#2d2813] bg-[#1a1915] text-[#6e684a]'
        }`}>
          {syncMessage}
          {syncState === 'done' && (
            <button onClick={() => setSyncState('idle')} className="ml-2 text-[#6e684a] hover:text-[#a8a99e]" aria-label="Dismiss">
              <RefreshCw size={10} className="inline" />
            </button>
          )}
        </div>
      )}

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