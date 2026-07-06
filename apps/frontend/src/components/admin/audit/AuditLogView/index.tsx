import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminApi, type AuditEvent, type AuditEventsFilters } from '../../../../services/admin';
import { AuditTable } from './AuditTable';
import { AuditFilters } from './AuditFilters';
import { AuditPagination } from './AuditPagination';

const LIMIT = 50;

export default function AuditLogView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
        limit: LIMIT,
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

  const handleRefresh = () => { setRefreshing(true); load(page, true); };
  const handleApply = () => { setPage(1); load(1); };
  const handleClear = () => {
    setSearch(''); setEventTypeFilter(''); setActorFilter(''); setResourceFilter('');
    setIpFilter(''); setFailedOnly(false); setFromDate(''); setToDate(''); setPage(1);
  };

  const hasFilters = !!(search || eventTypeFilter || actorFilter || resourceFilter || ipFilter || failedOnly || fromDate || toDate);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-forest-deep">Audit Logs</h1>
          <p className="text-xs text-graphite mt-0.5">All platform actions — who did what, from where, on what device.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <AuditFilters
        search={search} eventTypeFilter={eventTypeFilter} actorFilter={actorFilter}
        resourceFilter={resourceFilter} ipFilter={ipFilter} failedOnly={failedOnly}
        fromDate={fromDate} toDate={toDate} hasFilters={hasFilters}
        onSearchChange={setSearch} onEventTypeChange={setEventTypeFilter}
        onActorChange={setActorFilter} onResourceChange={setResourceFilter}
        onIpChange={setIpFilter} onFailedOnlyChange={setFailedOnly}
        onFromDateChange={setFromDate} onToDateChange={setToDate}
        onApply={handleApply} onClear={handleClear}
      />

      <AuditTable
        events={events} loading={loading} error={error}
        hasFilters={hasFilters} onClearFilters={handleClear}
      />

      <AuditPagination
        page={page} totalPages={totalPages} total={total} limit={LIMIT}
        onPrev={() => load(page - 1)} onNext={() => load(page + 1)}
      />
    </div>
  );
}
