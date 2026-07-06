/**
 * ProviderFilterBar — search + filter controls for the provider list.
 */
import { RefObject } from 'react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { PROVIDER_META, StatusFilter, ViewMode } from './types';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

export function ProviderFilterBar({
  search, onSearchChange, typeFilter, onTypeFilterChange,
  statusFilter, onStatusFilterChange, view, onViewChange, searchRef,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[#1a1915] border border-[#2d2813] rounded-2xl p-2.5">
      <div className="relative flex-1 min-w-0">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e684a] pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search providers by name, type, or URL…"
          className="w-full pl-9 pr-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] placeholder-[#525345] focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Filter size={12} className="text-[#6e684a] shrink-0" />
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-colors"
          aria-label="Filter by provider type"
        >
          <option value="all" className="bg-[#1a1915]">All types</option>
          {Object.entries(PROVIDER_META).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#1a1915]">{v.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-0.5 p-0.5 bg-[#181711] border border-[#2d2813] rounded-xl" role="tablist" aria-label="Filter by status">
        {(['all', 'active', 'disabled'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => onStatusFilterChange(s)}
            role="tab"
            aria-selected={statusFilter === s}
            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/20 ${
              statusFilter === s ? 'bg-yellow-500/15 text-yellow-300' : 'text-[#a8a99e] hover:text-[#cbd3cf]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 p-0.5 bg-[#181711] border border-[#2d2813] rounded-xl" role="group" aria-label="View mode">
        <button
          onClick={() => onViewChange('grid')}
          aria-pressed={view === 'grid'}
          className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/20 ${
            view === 'grid' ? 'bg-yellow-500/15 text-yellow-300' : 'text-[#a8a99e] hover:text-[#cbd3cf]'
          }`}
          title="Grid view" aria-label="Grid view"
        >
          <LayoutGrid size={13} />
        </button>
        <button
          onClick={() => onViewChange('list')}
          aria-pressed={view === 'list'}
          className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/20 ${
            view === 'list' ? 'bg-yellow-500/15 text-yellow-300' : 'text-[#a8a99e] hover:text-[#cbd3cf]'
          }`}
          title="List view" aria-label="List view"
        >
          <List size={13} />
        </button>
      </div>
    </div>
  );
}
