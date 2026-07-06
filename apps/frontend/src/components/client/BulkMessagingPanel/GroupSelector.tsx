import { Users } from 'lucide-react';
import type { ContactGroup } from '../../../services/api';

interface GroupSelectorProps {
  selectedGroup: string;
  onGroupChange: (v: string) => void;
  groups: ContactGroup[];
}

export default function GroupSelector({ selectedGroup, onGroupChange, groups }: GroupSelectorProps) {
  return (
    <div>
      <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1 flex items-center gap-1">
        <Users className="w-3 h-3" /> Send to group (overrides contacts)
      </label>
      <select
        value={selectedGroup} onChange={e => onGroupChange(e.target.value)}
        className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
      >
        <option value="">— No group —</option>
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name} ({g.member_count} members)</option>
        ))}
      </select>
    </div>
  );
}
