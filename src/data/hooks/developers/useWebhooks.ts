import { useState, useEffect, useCallback } from 'react';
import { useDataEvent } from '../shared/useDataEvent.js';
import { platformApi, type Webhook, type WebhookDelivery, type AuditLogEntry, type DeveloperLogEntry } from '../../api/platform.js';

// =============================================================================
// Developer ecosystem hooks (§14).
// Each hook owns its fetch + listens to relevant domain events for
// live refresh. Polls every 30s as a fallback.
// =============================================================================

function usePollingRefresh(refresh: () => void, ms = 30_000) {
  useEffect(() => {
    const t = setInterval(refresh, ms);
    return () => clearInterval(t);
  }, [refresh, ms]);
}

// Webhooks list
export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await platformApi.listWebhooks();
    if (res.success && res.data) setWebhooks(res.data);
    else setError(res.error ?? 'Failed to load');
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  usePollingRefresh(refresh);
  useDataEvent('message.sent');

  return { webhooks, loading, error, refresh };
}

export function useWebhookDeliveries(id: string | null) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!id) return;
    setLoading(true);
    platformApi.listWebhookDeliveries(id, 50).then(res => {
      if (res.success && res.data) setDeliveries(res.data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);
  usePollingRefresh(refresh, 15_000);

  return { deliveries, loading, refresh };
}

// Audit log
export function useAuditLog(filters?: { resource?: string; actor?: string; since?: string }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    platformApi.listAudit({ ...filters, limit: 200 }).then(res => {
      if (res.success && res.data) setEntries(res.data);
      setLoading(false);
    });
  }, [filters?.resource, filters?.actor, filters?.since]);

  useEffect(() => { refresh(); }, [refresh]);
  usePollingRefresh(refresh, 15_000);

  return { entries, loading };
}

// Developer API logs
export function useDeveloperLogs(filters?: { method?: string; minLatency?: number }) {
  const [entries, setEntries] = useState<DeveloperLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    platformApi.listDeveloperLogs({ ...filters, limit: 200 }).then(res => {
      if (res.success && res.data) setEntries(res.data);
      setLoading(false);
    });
  }, [filters?.method, filters?.minLatency]);

  useEffect(() => { refresh(); }, [refresh]);
  usePollingRefresh(refresh, 15_000);

  return { entries, loading };
}
