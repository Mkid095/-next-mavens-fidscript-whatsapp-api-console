import type { Instance } from '../../services/api';
import { DripFlowEditor, TriggerBuilder } from '../flows/index.js';
import { useDripEnrollments } from '../../data/hooks/useDripCampaigns.js';

interface DripBuilderPanelProps {
  campaignId: string | null;
  instances: Instance[];
  onMessageTemplateChange?: (template: { messageType: 'text' | 'media'; content: string; mediaUrl: string; instanceName: string }) => void;
}

/**
 * Phase 5 Slice D — DripBuilderPanel. Shown when the user picks type=drip
 * in CampaignBuilder. Lets them compose a step sequence (DripFlowEditor) and
 * add event triggers (TriggerBuilder). When the campaign is saved (campaignId
 * is set), also shows the live enrollments table.
 *
 * For pre-save state (campaignId=null), the parent still shows the
 * "Save draft" flow which creates the campaign as type=drip, then the panel
 * re-mounts with the new id and the user can attach steps + triggers.
 */
export default function DripBuilderPanel({ campaignId, instances, onMessageTemplateChange }: DripBuilderPanelProps) {
  const { enrollments } = useDripEnrollments(campaignId);

  if (!campaignId) {
    return (
      <div className="p-4 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl space-y-2">
        <p className="text-xs text-stone-700 font-bold">Save the campaign first</p>
        <p className="text-[10px] text-stone-500">
          Drip steps and triggers are attached to a saved campaign. Save the campaign as a draft (no launch), then come back to add the flow and triggers.
        </p>
        <p className="text-[10px] text-stone-400">
          Connected instances available: {instances.filter(i => i.status === 'connected').map(i => i.name).join(', ') || 'none'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DripFlowEditor campaignId={campaignId} />
      <TriggerBuilder campaignId={campaignId} />
      <div>
        <p className="text-[10px] font-bold text-graphite uppercase mb-1.5">Enrollments</p>
        {enrollments.length === 0 ? (
          <p className="text-[10px] text-stone-500">No customers enrolled yet. Triggers will add them when matching events fire, or you can enroll manually via the API.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {enrollments.map(e => (
              <div key={e.id} className="flex items-center gap-2 p-1.5 bg-white border border-[#eaebe4] rounded-lg text-[10px]">
                <span className={`px-1.5 py-0.5 rounded font-bold ${e.state === 'active' ? 'bg-yellow-100 text-yellow-800' : e.state === 'completed' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                  {e.state}
                </span>
                <span className="text-stone-700 flex-1 truncate">{e.customer_name || e.customer_id}</span>
                <span className="font-mono text-stone-400">step {e.current_step}</span>
                {e.next_step_at && <span className="text-stone-400">→ {new Date(e.next_step_at).toLocaleTimeString()}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
