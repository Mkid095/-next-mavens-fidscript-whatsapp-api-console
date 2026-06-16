import { useEffect, useMemo, useState } from 'react';
import type { Instance, Contact, Conversation } from '../../services/api';
import { useConversations } from '../../data';
import ConversationListPane from './ConversationListPane';
import ConversationThreadPane from './ConversationThreadPane';
import CustomerDrawer from './CustomerDrawer';
import NewChatModal from './NewChatModal';
import type { QueueKey } from './QueueFilter';

/** Digits-only comparison so "+2547…" and "2547…" match the same thread. */
const norm = (s: string): string => s.replace(/\D/g, '');

// InboxPage — the 3-pane inbox shell (§19). Owns queue/search/selection as the
// single source of truth so the selected conversation stays fresh after updates.
interface InboxPageProps {
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

function queueToFilter(queue: QueueKey): { assignee?: 'me' | 'unassigned' | 'team'; priority?: 'urgent'; status?: 'resolved'; sla_at_risk?: boolean } {
  switch (queue) {
    case 'mine': return { assignee: 'me' };
    case 'teams': return { assignee: 'team' };
    case 'unassigned': return { assignee: 'unassigned' };
    case 'urgent': return { priority: 'urgent' };
    case 'sla_at_risk': return { sla_at_risk: true };
    case 'resolved': return { status: 'resolved' };
    default: return {};
  }
}

export default function InboxPage({ instances, onTokenDeduct }: InboxPageProps) {
  const [queue, setQueue] = useState<QueueKey>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [draft, setDraft] = useState<Conversation | null>(null);

  const filter = useMemo(
    () => ({ ...queueToFilter(queue), q: search.trim() || undefined }),
    [queue, search]
  );
  const { conversations, loading, error, refresh } = useConversations(filter);

  // Reconcile: once the backend has persisted the real conversation for a draft
  // (created when the first message is sent), swap the draft out for it.
  useEffect(() => {
    if (!draft) return;
    const real = conversations.find((c) => norm(c.chat_id) === norm(draft.chat_id));
    if (real) { setSelectedId(real.id); setDraft(null); }
  }, [conversations, draft]);

  const selected = conversations.find((c) => c.id === selectedId) ?? draft;

  const handlePickContact = (contact: Contact) => {
    const existing = conversations.find((c) => norm(c.chat_id) === norm(contact.phone));
    if (existing) { setSelectedId(existing.id); setDraft(null); return; }
    // No thread yet — open a draft so the composer can send the first message;
    // the backend creates the conversation via the send/webhook path.
    setDraft({
      id: `draft:${contact.phone}`,
      customer_id: '', channel: 'whatsapp', instance_id: null, chat_id: contact.phone,
      status: 'open', priority: 'low', assignee_type: 'unassigned', assignee_id: null,
      unread_count: 0, last_message_at: null, ai_state: '', created_at: new Date().toISOString(),
      customer_name: contact.name, last_message: null, last_message_type: null,
    });
    setSelectedId(`draft:${contact.phone}`);
  };

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
        onSelect={(c) => { setSelectedId(c.id); setDraft(null); }}
        onNewChat={() => setShowNewChat(true)}
      />
      <ConversationThreadPane
        conversation={selected}
        instances={instances}
        onTokenDeduct={onTokenDeduct}
      />
      <CustomerDrawer
        conversation={selected && !selected.id.startsWith('draft:') ? selected : null}
        onUpdated={refresh}
      />
      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPick={handlePickContact}
      />
    </div>
  );
}
