// =============================================================================
// useCustomers — customer list + detail + realtime refresh (§6).
// Auto-refreshes when a customer.created / customer.tagged event fires.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';
import type { Customer, CustomerDetail } from '../api/platform.js';
import { useDataEvent } from './useDataEvent.js';

interface UseCustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCustomers(search?: string): UseCustomersState {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const newCustomerEvent = useDataEvent('customer.created');
  const taggedEvent = useDataEvent('customer.tagged');

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await platformApi.listCustomers(search);
    if (res.success && res.data) setCustomers(res.data);
    else setError(res.error || 'Failed to load customers');
    setLoading(false);
  }, [search]);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-fetch when a customer lifecycle event arrives
  useEffect(() => {
    if (newCustomerEvent || taggedEvent) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCustomerEvent, taggedEvent]);

  return { customers, loading, error, refresh };
}

// Single customer detail (identifiers + tags)
export function useCustomer(customerId: string | null) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) { setCustomer(null); return; }
    let cancelled = false;
    setLoading(true);
    platformApi.getCustomer(customerId).then((res) => {
      if (!cancelled && res.success && res.data) setCustomer(res.data);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [customerId]);

  return { customer, loading };
}
