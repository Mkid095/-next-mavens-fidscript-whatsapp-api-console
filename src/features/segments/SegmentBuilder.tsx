import { useState } from 'react';
import { ArrowLeft, Plus, Save, Search } from 'lucide-react';
import type { SegmentFilter, SegmentRule } from '../../data/api/platform.js';
import { useSegments, useSegmentPreview } from '../../data/hooks/useSegments.js';
import SegmentRuleRow from './SegmentRuleRow.js';
import SegmentPreview from './SegmentPreview.js';

interface SegmentBuilderProps {
  onBack: () => void;
  onSaved: () => void;
}

function defaultRule(): SegmentRule { return { field: 'tag', op: 'has_any_of', value: [] }; }

/**
 * Phase 5 Slice C — SegmentBuilder. Compose a filter_json interactively,
 * preview the matching customers before saving, and persist as a named
 * segment for reuse across campaigns.
 */
export default function SegmentBuilder({ onBack, onSaved }: SegmentBuilderProps) {
  const { create } = useSegments();
  const { preview, loading, error, run } = useSegmentPreview();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<SegmentRule[]>([defaultRule()]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filter: SegmentFilter = { logic, rules };
  const canPreview = rules.length > 0;
  const canSave = name.trim() && rules.length > 0;

  const updateRule = (i: number, r: SegmentRule) => setRules(prev => prev.map((x, idx) => idx === i ? r : x));
  const removeRule = (i: number) => setRules(prev => prev.filter((_, idx) => idx !== i));
  const addRule = () => setRules(prev => [...prev, defaultRule()]);

  const save = async () => {
    setSaving(true); setSaveError(null);
    const res = await create({ name: name.trim(), description: description.trim() || undefined, filter });
    if (res.success) onSaved();
    else setSaveError(res.error || 'Failed to save');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 text-stone-500 hover:text-forest-deep hover:bg-stone-100 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-forest-deep">New segment</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New VIP signups"
            className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Description (optional)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Who is in this segment?"
            className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-bold text-graphite uppercase">Rules</label>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-stone-500">Match</span>
            <button onClick={() => setLogic('AND')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded border ${logic === 'AND' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>ALL</button>
            <button onClick={() => setLogic('OR')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded border ${logic === 'OR' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>ANY</button>
          </div>
        </div>
        <div className="space-y-1.5">
          {rules.map((r, i) => (
            <SegmentRuleRow key={i} rule={r}
              onChange={nr => updateRule(i, nr)}
              onRemove={() => removeRule(i)} />
          ))}
        </div>
        <button onClick={addRule}
          className="mt-2 flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-white border border-stone-200 text-stone-700 rounded-lg">
          <Plus className="w-3 h-3" /> Add rule
        </button>
      </div>

      {canPreview && <SegmentPreview preview={preview} loading={loading} error={error} onRun={() => run(filter)} />}

      {saveError && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{saveError}</p>}

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-stone-100">
        <button onClick={onBack} className="px-3 py-2 text-xs font-bold bg-white border border-stone-200 text-stone-700 rounded-xl">Cancel</button>
        <button onClick={save} disabled={!canSave || saving}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-forest-deep text-white rounded-xl disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save segment'}
        </button>
      </div>
    </div>
  );
}
