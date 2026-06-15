export type CampaignFormType = 'broadcast' | 'drip' | 'trigger';

const TYPES: { value: CampaignFormType; label: string; hint: string }[] = [
  { value: 'broadcast', label: 'Broadcast', hint: 'Send once to a list/segment' },
  { value: 'drip', label: 'Drip', hint: 'Step sequence fired per enrolled customer' },
  { value: 'trigger', label: 'Trigger', hint: 'Event-driven one-shot (deprecated — use Drip + Triggers)' },
];

/** Campaign type selector (broadcast | drip | trigger). Sits at the top of
 *  CampaignBuilder. The "trigger" type is kept for symmetry with the schema
 *  but most event-driven flows should use a "drip" campaign with triggers
 *  attached. */
export default function CampaignTypeSelector({ value, onChange }: { value: CampaignFormType; onChange: (t: CampaignFormType) => void; }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Type</label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {TYPES.map(t => (
          <button key={t.value} onClick={() => onChange(t.value)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${value === t.value ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-stone-500 mt-1">{TYPES.find(t => t.value === value)?.hint}</p>
    </div>
  );
}
