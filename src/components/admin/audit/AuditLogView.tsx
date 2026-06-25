import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, type AuditEvent, type AuditEventsFilters } from '../../../services/admin';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Monitor,
  Smartphone,
  Globe,
  Shield,
  Clock,
  Key,
} from 'lucide-react';

/** Parse a user-agent string into a readable device description */
function parseUserAgent(ua: string | null): { icon: React.ReactNode; label: string } {
  if (!ua) return { icon: <Globe className="w-3 h-3" />, label: 'Unknown device' };
  const lower = ua.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone'))
    return { icon: <Smartphone className="w-3 h-3" />, label: 'Mobile' };
  if (lower.includes('tablet') || lower.includes('ipad'))
    return { icon: <Smartphone className="w-3 h-3" />, label: 'Tablet' };
  return { icon: <Monitor className="w-3 h-3" />, label: 'Desktop' };
}

/** Human-readable actor label from event */
function actorLabel(event: AuditEvent): string {
  if (!event.actorId) return 'System';
  if (event.actorType === 'api_key') return `API Key`;
  if (event.actorType === 'system') return 'System';
  // user type — the metadata usually has email
  const email = (event.metadata as Record<string, unknown>)?.email as string | undefined;
  return email || event.actorId.slice(0, 8);
}

/** Success/failure badge */
function StatusBadge({ eventType }: { eventType: string }) {
  const failed = eventType.includes('failed') || eventType.includes('error');
  return failed ? (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> Success
    </span>
  );
}

/** Actor chip with icon */
function ActorChip({ event }: { event: AuditEvent }) {
  const isSystem = !event.actorId || event.actorType === 'system';
  const isApiKey = event.actorType === 'api_key';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        isSystem ? 'bg-stone-100 text-stone-500' : isApiKey ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'
      }`}>
        {isSystem ? <Shield className="w-3 h-3" /> : isApiKey ? <Key className="w-3 h-3" /> : <span className="text-[8px] font-bold uppercase">{actorLabel(event).slice(0, 1)}</span>}
      </div>
      <span className="text-[10px] font-semibold text-stone-700 truncate max-w-[120px]" title={actorLabel(event)}>
        {actorLabel(event)}
      </span>
    </div>
  );
}

interface AuditRowProps {
  event: AuditEvent;
}

function AuditRow({ event }: AuditRowProps) {
  const device = parseUserAgent(event.userAgent);
  const failed = event.type.includes('failed') || event.type.includes('error');

  return (
    <div className={`flex items-start gap-4 px-4 py-3 hover:bg-stone-50/60 transition-colors border-b border-stone-100 ${
      failed ? 'bg-rose-50/20' : ''
    }`}>
      {/* Status */}
      <div className="shrink-0 mt-0.5">
        {failed
          ? <XCircle className="w-4 h-4 text-rose-500" />
          : <CheckCircle className="w-4 h-4 text-emerald-500" />
        }
      </div>

      {/* Actor */}
      <div className="w-36 shrink-0">
        <ActorChip event={event} />
        <div className="text-[8px] text-stone-400 mt-0.5 capitalize">{event.actorType || 'unknown'}</div>
      </div>

      {/* Action / Event type */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-semibold text-emerald-800 leading-tight">
          {event.type}
        </div>
        {event.resourceType && (
          <div className="text-[9px] text-stone-400 mt-0.5">
            {event.resourceType}
            {event.resourceId && <span className="font-mono"> / {event.resourceId.slice(0, 8)}…</span>}
          </div>
        )}
      </div>

      {/* IP */}
      <div className="w-28 shrink-0">
        {event.ipAddress ? (
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="text-[9px] font-mono text-stone-600">{event.ipAddress}</span>
          </div>
        ) : (
          <span className="text-[9px] text-stone-300">—</span>
        )}
      </div>

      {/* Device */}
      <div className="w-20 shrink-0">
        <div className="flex items-center gap-1 text-[9px] text-stone-500" title={event.userAgent || ''}>
          {device.icon}
          <span className="truncate">{device.label}</span>
        </div>
      </div>

      {/* Time */}
      <div className="w-36 shrink-0 text-right">
        <div className="flex items-center justify-end gap-1 text-[9px] text-stone-400">
          <Clock className="w-3 h-3" />
          <span>{new Date(event.timestamp).toLocaleString()}</span>
        </div>
        <div className="text-[8px] text-stone-300 mt-0.5">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Status badge */}
      <div className="w-20 shrink-0 flex justify-end">
        <StatusBadge eventType={event.type} />
      </div>
    </div>
  );
}

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
    } catch (e) {
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
            All platform actions — who did what, from where, on what device.
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

      {/* Filter bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Filter</span>
          {hasFilters && (
            <button onClick={handleClearFilters} className="ml-auto flex items-center gap-1 text-[9px] text-rose-500 hover:text-rose-700 font-semibold">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Search */}
          <div className="relative col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilterApply()}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Event type */}
          <input
            type="text"
            placeholder="Event type (e.g. identity.user)"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />

          {/* Actor ID */}
          <input
            type="text"
            placeholder="Actor ID or email"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />

          {/* Resource type */}
          <input
            type="text"
            placeholder="Resource type"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />

          {/* IP */}
          <input
            type="text"
            placeholder="IP address"
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />

          {/* Failed only toggle */}
          <button
            onClick={() => { setFailedOnly(v => !v); }}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
              failedOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'
            }`}
          >
            <AlertCircle className="w-3 h-3" /> Failures only
          </button>

          {/* Apply */}
          <button
            onClick={handleFilterApply}
            className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
          <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 bg-stone-50 border border-stone-200 text-[10px] rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-[9px] font-bold uppercase tracking-widest text-stone-500 shrink-0">
          <div className="w-4 shrink-0" /> {/* status icon */}
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
