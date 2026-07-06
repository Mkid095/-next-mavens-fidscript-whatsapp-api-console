/**
 * ProviderStatsRow — the 4 stat mini cards.
 */
import { Bot, CheckCircle2, Star, Globe } from 'lucide-react';
import { StatMini } from './shared-confirm';
import { StatFilter } from './types';

interface Props {
  stats: { total: number; active: number; default: number; shared: number };
  statFilter: StatFilter;
  onStatFilterChange: (f: StatFilter) => void;
}

export function ProviderStatsRow({ stats, statFilter, onStatFilterChange }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatMini icon={<Bot size={15} className="text-[#cbd3cf]" />} label="Total Providers" value={stats.total}
        onClick={() => onStatFilterChange(statFilter === 'total' ? null : 'total')} active={statFilter === 'total'} />
      <StatMini icon={<CheckCircle2 size={15} className="text-emerald-400" />} label="Active" value={stats.active} accent="success"
        onClick={() => onStatFilterChange(statFilter === 'active' ? null : 'active')} active={statFilter === 'active'} />
      <StatMini icon={<Star size={15} className="text-yellow-400" fill="currentColor" />} label="Default" value={stats.default} accent="warning"
        onClick={() => onStatFilterChange(statFilter === 'default' ? null : 'default')} active={statFilter === 'default'} />
      <StatMini icon={<Globe size={15} className="text-blue-400" />} label="Shared" value={stats.shared} accent="info"
        onClick={() => onStatFilterChange(statFilter === 'shared' ? null : 'shared')} active={statFilter === 'shared'} />
    </div>
  );
}
