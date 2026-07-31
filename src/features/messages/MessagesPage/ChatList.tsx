import { Inbox, Users, RefreshCw } from 'lucide-react';
import type { Instance } from '../../../services/api';
import { type ChatListItem } from '../messagesApi';
import ChatListPane from '../ChatListPane';
import InstanceSwitcher from './InstanceSwitcher';

interface ChatListSectionProps {
  instances: Instance[];
  chats: ChatListItem[];
  chatsLoading: boolean;
  chatsError: string | null;
  onSwitchInstance: (i: Instance) => void;
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
  activeTab: 'contacts' | 'groups' | 'outbox';
  onTabChange: (tab: 'contacts' | 'groups' | 'outbox') => void;
}

const TABS: { key: 'contacts' | 'groups' | 'outbox'; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'groups', label: 'Groups' },
  { key: 'outbox', label: 'Outbox' },
];

export default function ChatListSection({
  instances,
  chats,
  chatsLoading,
  chatsError,
  onSwitchInstance,
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
  activeTab,
  onTabChange,
}: ChatListSectionProps) {
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
            <InstanceSwitcher
              instances={instances}
              instance={instance}
              onSwitch={(i) => {
                onSwitchInstance(i);
                onSelectJid('');
                onDismissSync();
              }}
            />
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

      <div className="flex justify-center border-b border-[#2d2813] bg-[#1a1915] px-4 py-2 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`rounded-full px-4 py-1 text-xs font-medium transition ${
              activeTab === tab.key
                ? 'bg-[#eab308] text-black'
                : 'text-[#6e684a] hover:text-[#a8a99e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
