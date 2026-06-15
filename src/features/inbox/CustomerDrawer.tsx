import { useState } from 'react';
import { User, Tag, Clock3, ChevronDown } from 'lucide-react';
import type { Conversation } from '../../services/api';
import { useCustomer, platformApi } from '../../data';
import { aiStateMeta } from './helpers';
import CustomerTimeline from './CustomerTimeline';

// Right pane — Customer Intelligence drawer (§19): identity, tags, AI-state,
// assignment/priority/status controls, and the timeline.
interface CustomerDrawerProps {
  conversation: Conversation | null;
  onUpdated: () => void;
}

const STATUSES = ['open', 'pending', 'waiting_on_customer', 'resolved', 'closed'] as const;
const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

export default function CustomerDrawer({ conversation, onUpdated }: CustomerDrawerProps) {
  const { customer, loading } = useCustomer(conversation?.customer_id ?? null);
  const [saving, setSaving] = useState(false);
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

        {/* Tags */}
        {customer?.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {customer.tags.map((t) => (
              <span key={t.tag} className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                <Tag size={9} />{t.tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Assignment controls */}
      <div className="space-y-2 border-b border-stone-200 p-4">
        <SelectRow label="Status" value={conversation.status} options={STATUSES as unknown as string[]} disabled={saving} onChange={(v) => update({ status: v as Conversation['status'] })} />
        <SelectRow label="Priority" value={conversation.priority} options={PRIORITIES as unknown as string[]} disabled={saving} onChange={(v) => update({ priority: v as Conversation['priority'] })} />
      </div>

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          <Clock3 size={12} /> Timeline
        </div>
        <CustomerTimeline customerId={conversation.customer_id} />
      </div>
    </aside>
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
