import { Inbox, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Instance } from '../../../services/api';
import { useChatList } from '../useChatList';
import { messagesApi } from '../messagesApi';
import type { ChatListItem } from '../messagesApi';
import ChatListPane from '../ChatListPane';

interface ChatListSectionProps {
  instances: Instance[];
  selectedJid: string | null;
  onSelectJid: (jid: string) => void;
  onNewChat: () => void;
  instance: Instance | null;
  syncState: 'idle' | 'syncing' | 'done' | 'error';
  syncMessage: string;
  onSyncPhonebook: () => void;
  onRefreshChats: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  onDismissSync: () => void;
}

export default function ChatListSection({
  instances,
  selectedJid,
  onSelectJid,
  onNewChat,
  instance,
  syncState,
  syncMessage,
  onSyncPhonebook,
  onRefreshChats,
  search,
  onSearchChange,
  onDismissSync,
}: ChatListSectionProps) {
  const { chats, loading: chatsLoading, error: chatsError, refresh: refreshChats } = useChatList(instance?.name ?? null, selectedJid);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d2813] bg-[#1a1915] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-[#eab308]" />
          <h1 className="text-sm font-semibold text-white">Messages</h1>
          {instance && instance.status !== 'connected' && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              {instance.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void onSyncPhonebook()}
            disabled={!instance || instance.status !== 'connected' || syncState === 'syncing'}
            title="Sync WhatsApp phonebook (one-way: pulls contacts into your saved list)"
            className="flex items-center gap-1 rounded-lg border border-[#2d2813] bg-[#1a1915] px-2 py-1 text-[11px] text-[#a8a99e] transition hover:bg-[#2d2813] disabled:opacity-50"
          >
            <Users size={12} className={syncState === 'syncing' ? 'animate-pulse' : ''} />
            {syncState === 'syncing' ? 'Syncing…' : 'Sync contacts'}
          </button>
          {instances.length > 1 && (
            <InstanceSwitcher instances={instances} instance={instance} onSwitch={(i) => {
              onSelectJid('');
              onDismissSync();
            }} />
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
            <button onClick={onDismissSync} className="ml-2 text-[#6e684a] hover:text-[#a8a99e]" aria-label="Dismiss">
              <RefreshCw size={10} className="inline" />
            </button>
          )}
        </div>
      )}

      <ChatListPane
        chats={chats}
        loading={chatsLoading}
        error={chatsError}
        search={search}
        onSearchChange={onSearchChange}
        selectedJid={selectedJid}
        onSelect={(c) => onSelectJid(c.jid)}
        onNewChat={onNewChat}
        instanceName={instance?.name ?? ''}
        hiddenOnMobile={!!selectedJid}
        onRetry={() => void onRefreshChats()}
      />
    </>
  );
}

function InstanceSwitcher({ instances, instance, onSwitch }: { instances: Instance[]; instance: Instance | null; onSwitch: (i: Instance) => void }) {
  return (
    <select
      value={instance?.id ?? ''}
      onChange={(e) => {
        const found = instances.find((i) => i.id === e.target.value);
        if (found) onSwitch(found);
      }}
      className="appearance-none rounded-lg border border-[#2d2813] bg-[#1a1915] px-2.5 py-1.5 pr-7 text-xs text-[#a8a99e] outline-none focus:border-[#eab308]"
    >
      {instances.map((i) => (
        <option key={i.id} value={i.id} style={{ background: '#1a1915', color: '#a8a99e' }}>
          {i.name}{i.status === 'connected' ? ' · connected' : ''}
        </option>
      ))}
    </select>
  );
}
