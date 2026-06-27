import { useEffect, useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import type { Instance } from '../../services/api';
import { useChatList } from './useChatList';
import { useChatMessages } from './useChatMessages';
import ChatListPane from './ChatListPane';
import ChatThread from './ChatThread';
import NewChatModal from './NewChatModal';
import type { ChatListItem } from './messagesApi';

// MessagesPage — the WhatsApp-Web-style 2-pane shell. Owns the selected
// instance (defaults to the first connected) and the selected chat. The hooks
// fetch live from Evolution; sending goes through the existing client-JWT path.
interface MessagesPageProps {
  instances: Instance[];
}

function pickDefaultInstance(instances: Instance[]): Instance | null {
  const connected = instances.find((i) => i.status === 'connected');
  return connected ?? instances[0] ?? null;
}

export default function MessagesPage({ instances }: MessagesPageProps) {
  const [instance, setInstance] = useState<Instance | null>(() => pickDefaultInstance(instances));
  const [search, setSearch] = useState('');
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  // Keep the selected instance valid if the instances list updates.
  useEffect(() => {
    if (!instance) { setInstance(pickDefaultInstance(instances)); return; }
    const stillThere = instances.find((i) => i.id === instance.id);
    if (!stillThere) setInstance(pickDefaultInstance(instances));
  }, [instances, instance]);

  const { chats, loading: chatsLoading, error: chatsError, refresh: refreshChats } = useChatList(instance?.name ?? null);
  const { messages, loading: msgLoading, error: msgError, optimisticAppend } = useChatMessages(instance?.name ?? null, selectedJid);

  const selected = useMemo<ChatListItem | null>(() => {
    if (!selectedJid) return null;
    return chats.find((c) => c.jid === selectedJid) ?? {
      jid: selectedJid, name: selectedJid, isGroup: selectedJid.includes('@g.us'),
      lastMessage: '', lastMessageAt: null, unread: 0, profilePic: null,
    };
  }, [chats, selectedJid]);

  if (instances.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-stone-50 text-stone-400">
        <div className="text-center">
          <Inbox size={32} className="mx-auto mb-2" />
          <p className="text-sm">No WhatsApp instances yet</p>
          <p className="text-xs">Create and connect one to start chatting.</p>
        </div>
      </div>
    );
  }

  const threadOpen = !!selectedJid;
  const onSend = (optimistic: import('./messagesApi').MirrorMessage) => {
    optimisticAppend(optimistic);
    void refreshChats();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-[#181711]" />
          <h1 className="text-sm font-semibold text-stone-800">Messages</h1>
          {instance && instance.status !== 'connected' && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {instance.status}
            </span>
          )}
        </div>
        {instances.length > 1 && (
          <select
            value={instance?.id ?? ''}
            onChange={(e) => { setSelectedJid(null); setInstance(instances.find((i) => i.id === e.target.value) ?? null); }}
            className="appearance-none rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 pr-7 text-xs text-stone-700 outline-none focus:border-[#eab308]"
          >
            {instances.map((i) => (
              <option key={i.id} value={i.id}>{i.name}{i.status === 'connected' ? ' · connected' : ''}</option>
            ))}
          </select>
        )}
      </header>

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
          hiddenOnMobile={threadOpen}
        />
        <ChatThread
          chat={selected}
          instance={instance}
          messages={messages}
          loading={msgLoading}
          error={msgError}
          isMobileListVisible={!threadOpen}
          onBack={() => setSelectedJid(null)}
          onSend={onSend}
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