import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';

export interface CustomerAssignment {
  id: string;
  owner_user_id: string | null;
  team_id: string | null;
  owner_name: string | null;
  team_name: string | null;
}

// Per-customer long-term owner. Distinct from the conversation-level
// assignee: a customer may be owned by Sales even when their current
// conversation is unassigned.
export function useAssignment(customerId: string | null) {
  const [assignment, setAssignment] = useState<CustomerAssignment | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId) { setAssignment(null); return; }
    setLoading(true);
    const res = await platformApi.getAssignment(customerId);
    if (res.success) setAssignment(res.data ?? null);
    setLoading(false);
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);

  const set = useCallback(async (body: { owner_user_id?: string | null; team_id?: string | null }) => {
    if (!customerId) return;
    await platformApi.setAssignment(customerId, body);
    await refresh();
  }, [customerId, refresh]);

  return { assignment, loading, refresh, set };
}
