import { Filter } from 'lucide-react';
import { useTimeline } from '../../data/hooks/shared/useTimeline.js';

// Phase 3 - customer-timeline filter bar (§7.4).
// Toggle event-type chips; pass the active set down via prop so the timeline
// pane re-queries with the type filter.
const EVENT_TYPES = [
  'message.received', 'message.sent', 'message.delivered', 'message.read',
  'conversation.created', 'conversation.assigned', 'conversation.priority_changed', 'conversation.status_changed',
  'customer.tagged', 'customer.noted',
  'sla.breached', 'ai.handoff_requested', 'ai.reply.generated',
] as const;

export type TimelineFilterSet = ReadonlySet<string>;

export function toggleFilter(set: TimelineFilterSet, key: string): TimelineFilterSet {
  const next = new Set(set);
  if (next.has(key)) next.delete(key); else next.add(key);
  return next;
}

interface TimelineFiltersProps {
  active: TimelineFilterSet;
  onToggle: (key: string) => void;
  onClear: () => void;
}

export default function TimelineFilters({ active, onToggle, onClear }: TimelineFiltersProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <span className="flex items-center gap-1.5"><Filter size={12} /> Filter</span>
        {active.size > 0 && (
          <button onClick={onClear} className="text-[10px] font-normal normal-case text-forest-deep hover:underline">Clear</button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {EVENT_TYPES.map((k) => {
          const on = active.has(k);
          return (
            <button
              key={k}
              onClick={() => onToggle(k)}
              className={`rounded-full px-2 py-0.5 text-[10px] ${on ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-600'}`}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Re-export for callers that want to combine the filter chip UI with the
// timeline query without pulling in the EventTimeline renderer itself.
export function useFilteredTimeline(customerId: string | null, filter: TimelineFilterSet) {
  const { events, loading, error } = useTimeline(customerId);
  if (filter.size === 0) return { events, loading, error };
  return {
    events: events.filter((e) => filter.has(e.type)),
    loading,
    error,
  };
}
