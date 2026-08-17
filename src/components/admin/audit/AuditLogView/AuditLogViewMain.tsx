import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, type AuditEvent, type AuditEventsFilters } from '../../../../services/admin';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertCircle,
} from 'lucide-react';
import AuditRow from './AuditRow';
import AuditFilters from './AuditFilters';

export default function AuditLogView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const limit = 50;

  const load = useCallback(async (p: number = 1, suppressLoading = false) => {
    if (!suppressLoading) setLoading(true);
    setError(null);
    try {
      const filters: AuditEventsFilters = {
        eventType: eventTypeFilter || undefined,
        actorId: actorFilter || undefined,
        resourceType: resourceFilter || undefined,
        ipAddress: ipFilter || undefined,
        failedOnly: failedOnly || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: search || undefined,
        page: p,
        limit,
      };
      const res = await adminApi.getAuditEvents(filters);
      if (res.success && res.data) {
        setEvents(res.data.events);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        setPage(res.data.pagination.page);
      } else {
        setError('Failed to load audit events');
      }
    } catch {
      setError('Failed to load audit events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventTypeFilter, actorFilter, resourceFilter, ipFilter, failedOnly, fromDate, toDate, search]);

  useEffect(() => { load(1); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(page, true);
  };

  const handleFilterApply = () => {
    setPage(1);
    load(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setEventTypeFilter('');
    setActorFilter('');
    setResourceFilter('');
    setIpFilter('');
    setFailedOnly(false);
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasFilters = search || eventTypeFilter || actorFilter || resourceFilter || ipFilter || failedOnly || fromDate || toDate;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-forest-deep">Audit Logs</h1>
          <p className="text-xs text-graphite mt-0.5">
            All platform actions - who did what, from where, on what device.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <AuditFilters
        search={search}
        eventTypeFilter={eventTypeFilter}
        actorFilter={actorFilter}
        resourceFilter={resourceFilter}
        ipFilter={ipFilter}
        failedOnly={failedOnly}
        fromDate={fromDate}
        toDate={toDate}
        hasFilters={!!hasFilters}
        refreshing={refreshing}
        onSearchChange={setSearch}
        onEventTypeChange={setEventTypeFilter}
        onActorChange={setActorFilter}
        onResourceChange={setResourceFilter}
        onIpChange={setIpFilter}
        onFailedOnlyToggle={() => setFailedOnly(v => !v)}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApply={handleFilterApply}
        onClear={handleClearFilters}
        onRefresh={handleRefresh}
      />

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">
          <div className="w-4 shrink-0" />
          <div className="w-36 shrink-0">Actor</div>
          <div className="flex-1">Event / Resource</div>
          <div className="w-28 shrink-0">IP Address</div>
          <div className="w-20 shrink-0">Device</div>
          <div className="w-36 shrink-0 text-right">Timestamp</div>
          <div className="w-20 shrink-0 text-right">Status</div>
        </div>

        {/* Scrollable rows */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-48 text-stone-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading audit events...
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center h-48 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-2" /> {error}
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-xs gap-2">
              <Shield className="w-8 h-8 opacity-30" />
              <span>No audit events match your filters</span>
              {hasFilters && (
                <button onClick={handleClearFilters} className="text-emerald-600 underline text-[10px]">
                  Clear filters
                </button>
              )}
            </div>
          )}
          {!loading && !error && events.map((event) => (
            <AuditRow key={event.id} event={event} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 shrink-0">
          <span className="text-[9px] text-stone-400">
            {total === 0 ? 'No events' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-stone-600" />
            </button>
            <span className="text-[10px] font-mono text-stone-600 px-2">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
