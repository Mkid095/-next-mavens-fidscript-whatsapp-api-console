import React from 'react';
import { Search, Filter, X, AlertCircle } from 'lucide-react';

interface AuditFiltersProps {
  search: string;
  eventTypeFilter: string;
  actorFilter: string;
  resourceFilter: string;
  ipFilter: string;
  failedOnly: boolean;
  fromDate: string;
  toDate: string;
  hasFilters: boolean;
  onSearchChange: (v: string) => void;
  onEventTypeChange: (v: string) => void;
  onActorChange: (v: string) => void;
  onResourceChange: (v: string) => void;
  onIpChange: (v: string) => void;
  onFailedOnlyChange: (v: boolean) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export function AuditFilters({
  search, eventTypeFilter, actorFilter, resourceFilter, ipFilter, failedOnly,
  fromDate, toDate, hasFilters,
  onSearchChange, onEventTypeChange, onActorChange, onResourceChange, onIpChange,
  onFailedOnlyChange, onFromDateChange, onToDateChange, onApply, onClear,
}: AuditFiltersProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-3.5 h-3.5 text-stone-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Filter</span>
        {hasFilters && (
          <button onClick={onClear} className="ml-auto flex items-center gap-1 text-[9px] text-rose-500 hover:text-rose-700 font-semibold">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <div className="relative col-span-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search metadata..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>

        <input type="text" placeholder="Event type (e.g. identity.user)" value={eventTypeFilter}
          onChange={(e) => onEventTypeChange(e.target.value)}
          className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500" />
        <input type="text" placeholder="Actor ID or email" value={actorFilter}
          onChange={(e) => onActorChange(e.target.value)}
          className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500" />
        <input type="text" placeholder="Resource type" value={resourceFilter}
          onChange={(e) => onResourceChange(e.target.value)}
          className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500" />
        <input type="text" placeholder="IP address" value={ipFilter}
          onChange={(e) => onIpChange(e.target.value)}
          className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500" />

        <button
          onClick={() => onFailedOnlyChange(!failedOnly)}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
            failedOnly ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'
          }`}
        >
          <AlertCircle className="w-3 h-3" /> Failures only
        </button>

        <button onClick={onApply}
          className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors">
          Apply
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
        <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">From</span>
        <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)}
          className="px-2 py-1 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500" />
        <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">To</span>
        <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)}
          className="px-2 py-1 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500" />
      </div>
    </div>
  );
}
