import { useState } from 'react';
import { User, Clock3, ChevronDown } from 'lucide-react';
import type { Conversation } from '../../services/api';
import { useCustomer, platformApi, useTimeline } from '../../data';
import { aiStateMeta } from './helpers';
import { TagsManager, NotesEditor, AssignmentPanel, TimelineFilters, toggleFilter } from '../customers/index.js';
import type { TimelineFilterSet } from '../customers/index.js';
import { HandoffControls } from '../agents/index.js';

// Right pane — Customer Intelligence drawer (§19): identity, AI-state,
// assignment/priority/status controls, plus the Phase 3 tags/notes/owner
// surfaces. Timeline is filterable.
interface CustomerDrawerProps {
  conversation: Conversation | null;
  onUpdated: () => void;
}

const STATUSES = ['open', 'pending', 'waiting_on_customer', 'resolved', 'closed'] as const;
const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

export default function CustomerDrawer({ conversation, onUpdated }: CustomerDrawerProps) {
  const { customer } = useCustomer(conversation?.customer_id ?? null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<TimelineFilterSet>(new Set());
  const ai = aiStateMeta(conversation?.ai_state);

  const update = async (body: Record<string, unknown>) => {
    if (!conversation) return;
    setSaving(true);
    await platformApi.updateConversation(conversation.id, body);
    onUpdated();
    setSaving(false);
  };

  if (!conversation) {
    return <aside className="hidden w-[320px] shrink-0 border-l border-stone-200 bg-white xl:block" />;
  }

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-l border-stone-200 bg-white xl:flex">
      <div className="border-b border-stone-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-200 text-stone-600">
            <User size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-stone-800">
              {customer?.display_name || conversation.customer_name || conversation.chat_id}
            </h3>
            <p className="truncate text-[11px] text-stone-400">
              {customer?.identifiers?.[0]?.value || conversation.chat_id}
            </p>
          </div>
        </div>
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ai.badge}`}>{ai.label}</span>
      </div>

      {/* Conversation-level controls */}
      <div className="space-y-2 border-b border-stone-200 p-4">
        <SelectRow label="Status" value={conversation.status} options={STATUSES as unknown as string[]} disabled={saving} onChange={(v) => update({ status: v as Conversation['status'] })} />
        <SelectRow label="Priority" value={conversation.priority} options={PRIORITIES as unknown as string[]} disabled={saving} onChange={(v) => update({ priority: v as Conversation['priority'] })} />
      </div>

      {/* Customer-level (Phase 3) — tags, notes, account owner */}
      <div className="space-y-4 border-b border-stone-200 p-4">
        <TagsManager customerId={conversation.customer_id} />
        <NotesEditor customerId={conversation.customer_id} />
        <AssignmentPanel customerId={conversation.customer_id} />
        <HandoffControls conversation={conversation} />
      </div>

      {/* Timeline + filters */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          <Clock3 size={12} /> Timeline
        </div>
        <div className="px-4 pb-2">
          <TimelineFilters
            active={filter}
            onToggle={(k) => setFilter((prev) => toggleFilter(prev, k))}
            onClear={() => setFilter(new Set())}
          />
        </div>
        <FilteredTimeline customerId={conversation.customer_id} filter={filter} />
      </div>
    </aside>
  );
}

function FilteredTimeline({ customerId, filter }: { customerId: string; filter: TimelineFilterSet }) {
  const { events, loading, error } = useTimeline(customerId);
  if (loading) return <p className="px-4 text-xs text-stone-400">Loading…</p>;
  if (error) return <p className="px-4 text-xs text-red-600">{error}</p>;
  const filtered = filter.size === 0 ? events : events.filter((e) => filter.has(e.type));
  if (!filtered.length) return <p className="px-4 text-xs text-stone-400">No events</p>;
  return (
    <ul className="space-y-1 px-4 pb-4">
      {filtered.map((e) => (
        <li key={e.id} className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-[11px]">
          <p className="font-medium text-stone-700">{e.type}</p>
          <p className="text-stone-400">{new Date(e.created_at).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}

function SelectRow({ label, value, options, onChange, disabled }: { label: string; value: string; options: string[]; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-stone-500">{label}</label>
      <div className="relative mt-0.5">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs capitalize text-stone-700 outline-none focus:border-forest-deep"
        >
          {options.map((o) => <option key={o} value={o} className="capitalize">{o.replace(/_/g, ' ')}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-2 text-stone-400" />
      </div>
    </div>
  );
}
