import { useMemo, useState } from 'react';
import type { Instance } from '../../services/api';
import { useConversations } from '../../data';
import ConversationListPane from './ConversationListPane';
import ConversationThreadPane from './ConversationThreadPane';
import CustomerDrawer from './CustomerDrawer';
import type { QueueKey } from './QueueFilter';

// InboxPage — the 3-pane inbox shell (§19). Owns queue/search/selection as the
// single source of truth so the selected conversation stays fresh after updates.
interface InboxPageProps {
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

function queueToFilter(queue: QueueKey) {
  switch (queue) {
    case 'mine': return { assignee: 'me' as const };
    case 'unassigned': return { assignee: 'unassigned' as const };
    case 'urgent': return { priority: 'urgent' as const };
    case 'resolved': return { status: 'resolved' as const };
    default: return {};
  }
}

export default function InboxPage({ instances, onTokenDeduct }: InboxPageProps) {
  const [queue, setQueue] = useState<QueueKey>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filter = useMemo(
    () => ({ ...queueToFilter(queue), q: search.trim() || undefined }),
    [queue, search]
  );
  const { conversations, loading, error, refresh } = useConversations(filter);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full min-h-0 bg-stone-50">
      <ConversationListPane
        conversations={conversations}
        loading={loading}
        error={error}
        queue={queue}
        onQueueChange={setQueue}
        search={search}
        onSearchChange={setSearch}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
      />
      <ConversationThreadPane
        conversation={selected}
        instances={instances}
        onTokenDeduct={onTokenDeduct}
      />
      <CustomerDrawer conversation={selected} onUpdated={refresh} />
    </div>
  );
}
