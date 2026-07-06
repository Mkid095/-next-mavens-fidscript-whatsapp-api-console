import React from 'react';
import { Shield } from 'lucide-react';
import type { AuditEvent } from '../../../../services/admin';
import { AuditRow } from './AuditRow';

export interface AuditTableProps {
  events: AuditEvent[];
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function AuditTable({ events, loading, error, hasFilters, onClearFilters }: AuditTableProps) {
  return (
    <div className="flex-1 min-h-0 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-4 px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">
        <div className="w-4 shrink-0" />
        <div className="w-36 shrink-0">Actor</div>
        <div className="flex-1">Event / Resource</div>
        <div className="w-28 shrink-0">IP Address</div>
        <div className="w-20 shrink-0">Device</div>
        <div className="w-36 shrink-0 text-right">Timestamp</div>
        <div className="w-20 shrink-0 text-right">Status</div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-48 text-stone-400 text-xs">
            Loading audit events...
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center justify-center h-48 text-rose-500 text-xs">{error}</div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-xs gap-2">
            <Shield className="w-8 h-8 opacity-30" />
            <span>No audit events match your filters</span>
            {hasFilters && (
              <button onClick={onClearFilters} className="text-emerald-600 underline text-[10px]">Clear filters</button>
            )}
          </div>
        )}
        {!loading && !error && events.map((event) => (
          <AuditRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
