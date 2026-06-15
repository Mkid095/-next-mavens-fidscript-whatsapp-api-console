import { Inbox, UserCircle, UserMinus, AlertCircle, CheckCircle2, Users, Timer } from 'lucide-react';

// The inbox queue tabs — each maps to a useConversations filter.
// 7 queues per §19.3: All, Mine, My teams, Unassigned, Urgent, SLA at risk, Resolved.
export type QueueKey = 'all' | 'mine' | 'teams' | 'unassigned' | 'urgent' | 'sla_at_risk' | 'resolved';

interface QueueFilterProps {
  active: QueueKey;
  onChange: (q: QueueKey) => void;
}

const QUEUES: { key: QueueKey; label: string; icon: typeof Inbox }[] = [
  { key: 'all', label: 'All', icon: Inbox },
  { key: 'mine', label: 'Mine', icon: UserCircle },
  { key: 'teams', label: 'My teams', icon: Users },
  { key: 'unassigned', label: 'Unassigned', icon: UserMinus },
  { key: 'urgent', label: 'Urgent', icon: AlertCircle },
  { key: 'sla_at_risk', label: 'SLA at risk', icon: Timer },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

export default function QueueFilter({ active, onChange }: QueueFilterProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-200 px-2 py-1.5">
      {QUEUES.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              isActive ? 'bg-forest-deep text-white' : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
