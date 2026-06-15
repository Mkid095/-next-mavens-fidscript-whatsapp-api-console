import { Inbox, UserCircle, UserMinus, AlertCircle, CheckCircle2 } from 'lucide-react';

// The inbox queue tabs — each maps to a useConversations filter.
export type QueueKey = 'all' | 'mine' | 'unassigned' | 'urgent' | 'resolved';

interface QueueFilterProps {
  active: QueueKey;
  onChange: (q: QueueKey) => void;
}

const QUEUES: { key: QueueKey; label: string; icon: typeof Inbox }[] = [
  { key: 'all', label: 'All', icon: Inbox },
  { key: 'mine', label: 'Mine', icon: UserCircle },
  { key: 'unassigned', label: 'Unassigned', icon: UserMinus },
  { key: 'urgent', label: 'Urgent', icon: AlertCircle },
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
