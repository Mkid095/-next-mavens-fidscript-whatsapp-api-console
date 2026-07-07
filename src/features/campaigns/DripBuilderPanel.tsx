import type { Instance } from '../../services/api';
import { DripFlowEditor, TriggerBuilder } from '../flows/index.js';
import { useDripEnrollments } from '../../data/hooks/automation/useDripCampaigns.js';

interface DripBuilderPanelProps {
  campaignId: string | null;
  instances: Instance[];
  onMessageTemplateChange?: (template: { messageType: 'text' | 'media'; content: string; mediaUrl: string; instanceName: string }) => void;
}

export default function DripBuilderPanel({ campaignId, instances, onMessageTemplateChange }: DripBuilderPanelProps) {
  const { enrollments } = useDripEnrollments(campaignId);

  if (!campaignId) {
    return (
      <div className="p-4 bg-[#181711] border border-[#2d2813] rounded-xl space-y-2">
        <p className="text-xs text-[#a8a99e] font-bold">Save the campaign first</p>
        <p className="text-[10px] text-[#6e684a]">
          Drip steps and triggers are attached to a saved campaign. Save the campaign as a draft (no launch), then come back to add the flow and triggers.
        </p>
        <p className="text-[10px] text-[#5a554a]">
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
        <p className="text-[10px] font-bold text-[#6e684a] uppercase mb-1.5">Enrollments</p>
        {enrollments.length === 0 ? (
          <p className="text-[10px] text-[#6e684a]">No customers enrolled yet. Triggers will add them when matching events fire, or you can enroll manually via the API.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {enrollments.map(e => (
              <div key={e.id} className="flex items-center gap-2 p-1.5 bg-[#1a1915] border border-[#2d2813] rounded-lg text-[10px]">
                <span className={`px-1.5 py-0.5 rounded font-bold ${e.state === 'active' ? 'bg-yellow-900/30 text-yellow-500' : e.state === 'completed' ? 'bg-green-900/40 text-green-400' : 'bg-[#2d2813] text-[#a8a99e]'}`}>
                  {e.state}
                </span>
                <span className="text-[#a8a99e] flex-1 truncate">{e.customer_name || e.customer_id}</span>
                <span className="font-mono text-[#6e684a]">step {e.current_step}</span>
                {e.next_step_at && <span className="text-[#6e684a]">→ {new Date(e.next_step_at).toLocaleTimeString()}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
