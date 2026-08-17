export type CampaignFormType = 'broadcast' | 'drip' | 'trigger';

const TYPES: { value: CampaignFormType; label: string; hint: string }[] = [
  { value: 'broadcast', label: 'Broadcast', hint: 'Send once to a list/segment' },
  { value: 'drip', label: 'Drip', hint: 'Step sequence fired per enrolled customer' },
  { value: 'trigger', label: 'Trigger', hint: 'Event-driven one-shot (deprecated - use Drip + Triggers)' },
];

export default function CampaignTypeSelector({ value, onChange }: { value: CampaignFormType; onChange: (t: CampaignFormType) => void; }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Type</label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {TYPES.map(t => (
          <button key={t.value} onClick={() => onChange(t.value)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${value === t.value ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[#6e684a] mt-1">{TYPES.find(t => t.value === value)?.hint}</p>
    </div>
  );
}
