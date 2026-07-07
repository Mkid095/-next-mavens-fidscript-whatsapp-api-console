import { useCallback, useEffect, useState } from 'react';
import { campaignsApi } from '../../../services/contacts.js';
import type {
  CampaignStep, CampaignTrigger, DripEnrollment,
  StepActionType, StepActionConfig, TriggerEvent,
} from '../../api/platform.js';

// =============================================================================
// Phase 5 Slice D — hooks for the trigger + drip routes.
// Each hook is campaign-scoped; pass null for campaignId to disable.
// =============================================================================

function asStepArray(rows: unknown): CampaignStep[] {
  if (!Array.isArray(rows)) return [];
  return rows as CampaignStep[];
}
function asTriggerArray(rows: unknown): CampaignTrigger[] {
  if (!Array.isArray(rows)) return [];
  return rows as CampaignTrigger[];
}
function asEnrollmentArray(rows: unknown): DripEnrollment[] {
  if (!Array.isArray(rows)) return [];
  return rows as DripEnrollment[];
}

/** Steps for one campaign. CRUD with auto-refresh. */
export function useCampaignSteps(campaignId: string | null) {
  const [steps, setSteps] = useState<CampaignStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!campaignId) { setSteps([]); return; }
    setLoading(true); setError(null);
    const res = await campaignsApi.listSteps(campaignId);
    if (res.success && res.data) setSteps(asStepArray(res.data));
    else setError(res.error ?? 'Failed to load steps');
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: { step_order?: number; delay_seconds?: number; action_type: StepActionType; action_config?: StepActionConfig }) => {
    if (!campaignId) return { success: false, error: 'no campaign' };
    const res = await campaignsApi.createStep(campaignId, body);
    if (res.success) await refresh();
    return res;
  }, [campaignId, refresh]);

  const update = useCallback(async (stepId: string, body: Partial<{ step_order: number; delay_seconds: number; action_type: StepActionType; action_config: StepActionConfig }>) => {
    if (!campaignId) return { success: false, error: 'no campaign' };
    const res = await campaignsApi.updateStep(campaignId, stepId, body);
    if (res.success) await refresh();
    return res;
  }, [campaignId, refresh]);

  const remove = useCallback(async (stepId: string) => {
    if (!campaignId) return { success: false, error: 'no campaign' };
    const res = await campaignsApi.deleteStep(campaignId, stepId);
    if (res.success) await refresh();
    return res;
  }, [campaignId, refresh]);

  return { steps, loading, error, refresh, create, update, remove };
}

/** Triggers for one campaign. */
export function useCampaignTriggers(campaignId: string | null) {
  const [triggers, setTriggers] = useState<CampaignTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!campaignId) { setTriggers([]); return; }
    setLoading(true); setError(null);
    const res = await campaignsApi.listTriggers(campaignId);
    if (res.success && res.data) setTriggers(asTriggerArray(res.data));
    else setError(res.error ?? 'Failed to load triggers');
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: { event: TriggerEvent; filter_json?: Record<string, unknown> }) => {
    if (!campaignId) return { success: false, error: 'no campaign' };
    const res = await campaignsApi.createTrigger(campaignId, body);
    if (res.success) await refresh();
    return res;
  }, [campaignId, refresh]);

  const remove = useCallback(async (triggerId: string) => {
    if (!campaignId) return { success: false, error: 'no campaign' };
    const res = await campaignsApi.deleteTrigger(campaignId, triggerId);
    if (res.success) await refresh();
    return res;
  }, [campaignId, refresh]);

  return { triggers, loading, error, refresh, create, remove };
}

/** Enrollments for one campaign. */
export function useDripEnrollments(campaignId: string | null) {
  const [enrollments, setEnrollments] = useState<DripEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!campaignId) { setEnrollments([]); return; }
    setLoading(true); setError(null);
    const res = await campaignsApi.listEnrollments(campaignId);
    if (res.success && res.data) setEnrollments(asEnrollmentArray(res.data));
    else setError(res.error ?? 'Failed to load enrollments');
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { refresh(); }, [refresh]);

  const enroll = useCallback(async (customerId: string) => {
    if (!campaignId) return { success: false, error: 'no campaign' };
    const res = await campaignsApi.enroll(campaignId, customerId);
    if (res.success) await refresh();
    return res;
  }, [campaignId, refresh]);

  return { enrollments, loading, error, refresh, enroll };
}
