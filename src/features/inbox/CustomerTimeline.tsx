import { MessageSquare, UserPlus, Bot, RefreshCw, Tag, Package } from 'lucide-react';
import { useTimeline } from '../../data';
import { timeAgo, timelineEntryLabel } from './helpers';

// The Customer Timeline — the killer drawer feature (§7). Reads domain_events.
interface CustomerTimelineProps {
  customerId: string | null;
}

function eventIcon(type: string) {
  if (type.startsWith('message.')) return MessageSquare;
  if (type === 'customer.created') return UserPlus;
  if (type.startsWith('ai.')) return Bot;
  if (type === 'customer.tagged') return Tag;
  if (type.startsWith('order.')) return Package;
  return RefreshCw;
}

function eventSummary(type: string, payload: Record<string, unknown>): string {
  const content = payload.content ? String(payload.content).slice(0, 60) : '';
  if (type === 'message.received' || type === 'message.sent') return content || 'Message';
  if (type === 'customer.created') return 'Customer created';
  if (type === 'conversation.created') return 'Conversation started';
  if (type === 'conversation.assigned') return `Assigned to ${payload.assigneeType || '—'}`;
  if (type === 'conversation.status_changed') return `Status → ${payload.status || '—'}`;
  if (type === 'ai.reply.generated') return `AI replied (confidence ${Math.round(Number(payload.confidence || 0) * 100)}%)`;
  if (type === 'ai.handoff_requested') return 'Escalated to human';
  if (type === 'customer.tagged') return `Tagged "${payload.tag || ''}"`;
  if (type === 'order.created') return `Order ${payload.orderId || ''}`;
  return type;
}

export default function CustomerTimeline({ customerId }: CustomerTimelineProps) {
  const { events, loading } = useTimeline(customerId);

  if (!customerId) return null;
  if (loading && events.length === 0) return <p className="px-3 py-2 text-xs text-stone-400">Loading timeline…</p>;
  if (events.length === 0) return <p className="px-3 py-2 text-xs text-stone-400">No activity yet</p>;

  return (
    <div className="space-y-0.5">
      {events.map((e) => {
        const Icon = eventIcon(e.type);
        const meta = timelineEntryLabel(e.type);
        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(e.payload); } catch { /* malformed */ }
        return (
          <div key={e.id} className="flex gap-2 px-3 py-1.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100">
              <Icon size={12} className={meta.tone} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-700">{eventSummary(e.type, payload)}</p>
              <p className="text-[10px] text-stone-400">{meta.label} · {timeAgo(e.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
