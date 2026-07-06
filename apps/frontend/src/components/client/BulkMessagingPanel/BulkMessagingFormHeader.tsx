import type { Instance } from '../../../services/api';

interface BulkMessagingFormHeaderProps {
  campaignName: string;
  onCampaignNameChange: (v: string) => void;
  selectedInstance: string;
  onInstanceChange: (v: string) => void;
  instances: Instance[];
}

export default function BulkMessagingFormHeader({
  campaignName, onCampaignNameChange,
  selectedInstance, onInstanceChange, instances,
}: BulkMessagingFormHeaderProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1">Campaign name</label>
        <input
          type="text" value={campaignName} onChange={e => onCampaignNameChange(e.target.value)}
          placeholder="e.g. Black Friday promo"
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] placeholder:text-[#5a554a] focus:outline-none focus:border-[#eab308]"
        />
      </div>
      <div>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1">Send from</label>
        <select
          value={selectedInstance} onChange={e => onInstanceChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
        >
          <option value="">Select instance</option>
          {instances.map(i => (
            <option key={i.id} value={i.name}>
              {i.display_name || i.name} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
