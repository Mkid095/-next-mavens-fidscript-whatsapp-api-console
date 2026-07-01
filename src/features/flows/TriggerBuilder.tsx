import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import type { TriggerEvent } from '../../data/api/platform.js';
import { useCampaignTriggers } from '../../data/hooks/useDripCampaigns.js';

const EVENTS: { value: TriggerEvent; label: string; description: string; filterKey?: string }[] = [
  { value: 'customer.created', label: 'Customer created', description: 'A new customer first appears (e.g. first message received)' },
  { value: 'customer.tagged', label: 'Customer tagged', description: 'A customer is tagged', filterKey: 'tag' },
  { value: 'conversation.created', label: 'Conversation created', description: 'A new conversation is opened' },
  { value: 'order.created', label: 'Order created', description: 'An order is placed (commerce)', filterKey: 'min_total' },
];

interface TriggerBuilderProps {
  campaignId: string;
  onTriggersChange?: (count: number) => void;
}

export default function TriggerBuilder({ campaignId, onTriggersChange }: TriggerBuilderProps) {
  const { triggers, loading, create, remove } = useCampaignTriggers(campaignId || null);
  const [event, setEvent] = useState<TriggerEvent>('customer.created');
  const [filterKey, setFilterKey] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { onTriggersChange?.(triggers.length); }, [triggers.length, onTriggersChange]);

  const ev = EVENTS.find(e => e.value === event);
  const requiresFilter = !!ev?.filterKey;

  const add = async () => {
    setSaving(true); setError(null);
    const filter_json: Record<string, unknown> = {};
    if (requiresFilter && filterKey && filterVal) filter_json[filterKey] = isNaN(Number(filterVal)) ? filterVal : Number(filterVal);
    const res = await create({ event, filter_json });
    if (!res.success) setError(res.error || 'Failed to add trigger');
    setFilterVal(''); setFilterKey('');
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-bold text-[#6e684a] uppercase">Triggers</p>
        <p className="text-[10px] text-[#6e684a]">Events that auto-enroll customers into this campaign.</p>
      </div>

      {error && <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2">{error}</p>}

      {triggers.length === 0 && !loading ? (
        <div className="p-6 border-2 border-dashed border-[#2d2813] rounded-xl text-center">
          <Zap className="w-6 h-6 mx-auto text-[#6e684a] mb-1" />
          <p className="text-xs text-[#6e684a]">No triggers. Add one to start enrolling customers automatically.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {triggers.map(t => (
            <div key={t.id} className="flex items-center gap-2 p-2.5 bg-[#1a1915] border border-[#2d2813] rounded-xl">
              <Zap className="w-3.5 h-3.5 text-[#eab308] shrink-0" />
              <span className="text-xs font-bold text-[#a8a99e]">{t.event}</span>
              <span className="text-[10px] text-[#6e684a] font-mono flex-1 truncate">
                {Object.keys(t.filter_json || {}).length ? JSON.stringify(t.filter_json) : 'no filter'}
              </span>
              <button onClick={() => remove(t.id)} className="p-1 text-[#6e684a] hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-2.5 bg-[#181711] border border-[#2d2813] rounded-xl space-y-1.5">
        <div className="flex items-center gap-2">
          <select value={event} onChange={e => setEvent(e.target.value as TriggerEvent)}
            className="flex-1 px-2 py-1.5 text-xs border border-[#2d2813] bg-[#1a1915] text-[#a8a99e] rounded-lg font-bold focus:outline-none focus:border-[#eab308]">
            {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <p className="text-[10px] text-[#6e684a]">{ev?.description}</p>
        {requiresFilter && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#6e684a] w-20">{ev?.filterKey} =</span>
            <input value={filterVal} onChange={e => setFilterVal(e.target.value)} placeholder={ev?.filterKey === 'tag' ? 'vip' : '1000'}
              className="flex-1 px-2 py-1.5 text-xs border border-[#2d2813] bg-[#1a1915] text-[#a8a99e] rounded-lg font-mono placeholder:text-[#5a554a] focus:outline-none focus:border-[#eab308]" />
          </div>
        )}
        <button onClick={add} disabled={saving}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg disabled:opacity-50">
          {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Adding…</> : <><Plus className="w-3 h-3" /> Add trigger</>}
        </button>
      </div>
    </div>
  );
}
