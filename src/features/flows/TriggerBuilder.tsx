import { useEffect, useState } from 'react';
import { Plus, Save, RefreshCw, Trash2, Zap } from 'lucide-react';
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

/**
 * Phase 5 Slice D — TriggerBuilder. List of events that auto-enroll customers
 * into this campaign. Each trigger can be narrowed by a simple filter
 * (e.g. tag=VIP, min_total=1000). Saves immediately on Add.
 */
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
        <p className="text-[10px] font-bold text-graphite uppercase">Triggers</p>
        <p className="text-[10px] text-stone-500">Events that auto-enroll customers into this campaign. The customer gets added to the drip sequence at step 0.</p>
      </div>

      {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {triggers.length === 0 && !loading ? (
        <div className="p-6 border-2 border-dashed border-stone-200 rounded-xl text-center">
          <Zap className="w-6 h-6 mx-auto text-stone-300 mb-1" />
          <p className="text-xs text-stone-500">No triggers. Add one to start enrolling customers automatically.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {triggers.map(t => (
            <div key={t.id} className="flex items-center gap-2 p-2.5 bg-white border border-[#eaebe4] rounded-xl">
              <Zap className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
              <span className="text-xs font-bold text-stone-700">{t.event}</span>
              <span className="text-[10px] text-stone-500 font-mono flex-1 truncate">
                {Object.keys(t.filter_json || {}).length ? JSON.stringify(t.filter_json) : 'no filter'}
              </span>
              <button onClick={() => remove(t.id)} className="p-1 text-stone-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-2.5 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl space-y-1.5">
        <div className="flex items-center gap-2">
          <select value={event} onChange={e => setEvent(e.target.value as TriggerEvent)}
            className="flex-1 px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg font-bold">
            {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <p className="text-[10px] text-stone-500">{ev?.description}</p>
        {requiresFilter && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-500 w-20">{ev?.filterKey} =</span>
            <input value={filterVal} onChange={e => setFilterVal(e.target.value)} placeholder={ev?.filterKey === 'tag' ? 'vip' : '1000'}
              className="flex-1 px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg font-mono" />
          </div>
        )}
        <button onClick={add} disabled={saving}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-forest-deep text-white rounded-lg disabled:opacity-50">
          {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Adding…</> : <><Plus className="w-3 h-3" /> Add trigger</>}
        </button>
      </div>
    </div>
  );
}
