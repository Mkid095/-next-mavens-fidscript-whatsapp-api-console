import { useEffect, useState } from 'react';
import { Plus, Save, RefreshCw } from 'lucide-react';
import type { CampaignStep, StepActionType } from '../../data/api/platform.js';
import { useCampaignSteps } from '../../data/hooks/useDripCampaigns.js';
import StepRow from './StepRow.js';

interface DripFlowEditorProps {
  campaignId: string;
  /** Initial local steps; we sync from the server when this is set. */
  onStepsChange?: (steps: CampaignStep[]) => void;
}

/**
 * Phase 5 Slice D — DripFlowEditor. List of steps for one drip campaign.
 * Edits stay in local state until "Save" is pressed, then PATCH per row.
 * Local-only mode (campaignId='') lets a user compose a flow before saving
 * the parent campaign; the parent's `onStepsChange` receives the array.
 */
export default function DripFlowEditor({ campaignId, onStepsChange }: DripFlowEditorProps) {
  const { steps: serverSteps, loading, create, update, remove } = useCampaignSteps(campaignId || null);
  const [local, setLocal] = useState<CampaignStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync from server when it loads (or when campaignId changes)
  useEffect(() => {
    if (campaignId) setLocal(serverSteps);
  }, [campaignId, serverSteps]);

  // Notify parent of changes (for unsaved flows)
  useEffect(() => { onStepsChange?.(local); }, [local, onStepsChange]);

  const newStep = (action_type: StepActionType = 'send_text'): CampaignStep => ({
    id: `local_${Math.random().toString(36).slice(2, 10)}`,
    campaign_id: campaignId,
    step_order: local.length,
    delay_seconds: 0,
    action_type,
    action_config: {},
  });

  const addStep = () => setLocal(prev => [...prev, newStep()]);
  const updateStep = (i: number, s: CampaignStep) => setLocal(prev => prev.map((x, idx) => idx === i ? s : x));
  const deleteStep = (i: number) => setLocal(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!campaignId) return;
    setSaving(true); setError(null);
    try {
      // Diff local vs server: figure out which to create, which to update, which to delete
      const serverIds = new Set(serverSteps.map(s => s.id));
      const localIds = new Set(local.map(s => s.id));
      for (const s of local) {
        if (serverIds.has(s.id)) {
          await update(s.id, { step_order: s.step_order, delay_seconds: s.delay_seconds, action_type: s.action_type, action_config: s.action_config });
        } else {
          await create({ step_order: s.step_order, delay_seconds: s.delay_seconds, action_type: s.action_type, action_config: s.action_config });
        }
      }
      for (const s of serverSteps) {
        if (!localIds.has(s.id)) await remove(s.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-graphite uppercase">Drip steps</p>
          <p className="text-[10px] text-stone-500">Sequence of actions fired per enrolled customer. Delays stack on top of the previous step's delay.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {campaignId && (
            <button onClick={save} disabled={saving || loading}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-forest-deep text-white rounded-lg disabled:opacity-50">
              {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving…</> : <><Save className="w-3 h-3" /> Save flow</>}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      <div className="space-y-1.5">
        {local.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-stone-200 rounded-xl text-center">
            <p className="text-xs text-stone-500">No steps yet. Add the first one to start the drip.</p>
          </div>
        ) : (
          local.map((s, i) => (
            <StepRow key={s.id} step={s} index={i}
              onChange={ns => updateStep(i, ns)}
              onDelete={() => deleteStep(i)} />
          ))
        )}
      </div>

      <button onClick={addStep}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-white border border-stone-200 text-stone-700 rounded-lg">
        <Plus className="w-3 h-3" /> Add step
      </button>
    </div>
  );
}
