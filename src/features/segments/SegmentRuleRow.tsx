import { X } from 'lucide-react';
import type { SegmentRule } from '../../data/api/platform.js';

interface SegmentRuleRowProps {
  rule: SegmentRule;
  onChange: (rule: SegmentRule) => void;
  onRemove: () => void;
}

const FIELD_OPTIONS: { value: SegmentRule['field']; label: string }[] = [
  { value: 'tag', label: 'Tag' },
  { value: 'last_seen', label: 'Last seen' },
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
  { value: 'channel', label: 'Channel' },
];

/** Pull the `op` + `value` UI controls for a given field. */
function RuleValueEditor({ rule, onChange }: { rule: SegmentRule; onChange: (r: SegmentRule) => void }) {
  if (rule.field === 'tag') {
    const arr = Array.isArray(rule.value) ? rule.value : [];
    return (
      <input value={arr.join(', ')} placeholder="vip, new_signup"
        onChange={e => onChange({ ...rule, value: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        className="flex-1 px-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg placeholder:text-[#5a554a]" />
    );
  }
  if (rule.field === 'last_seen' || rule.field === 'created') {
    if (rule.op === 'never') return <span className="text-[10px] text-[#6e684a]">—</span>;
    return (
      <div className="flex items-center gap-1">
        <input type="number" min={0} value={Number(rule.value ?? 0)} onChange={e => onChange({ ...rule, value: Number(e.target.value) })}
          className="w-16 px-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg font-mono" />
        <span className="text-[10px] text-[#6e684a]">days</span>
      </div>
    );
  }
  if (rule.field === 'name') {
    return (
      <input value={String(rule.value ?? '')} placeholder="contains…"
        onChange={e => onChange({ ...rule, value: e.target.value })}
        className="flex-1 px-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg placeholder:text-[#5a554a]" />
    );
  }
  if (rule.field === 'channel') {
    return (
      <select value={String(rule.value)} onChange={e => onChange({ ...rule, value: e.target.value as 'whatsapp' | 'sms' | 'email' })}
        className="px-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg">
        <option value="whatsapp">WhatsApp</option>
        <option value="sms">SMS</option>
        <option value="email">Email</option>
      </select>
    );
  }
  return null;
}

function opsFor(field: SegmentRule['field']): { value: string; label: string }[] {
  switch (field) {
    case 'tag': return [
      { value: 'has_any_of', label: 'has any of' },
      { value: 'has_all_of', label: 'has all of' },
      { value: 'has_none_of', label: 'has none of' },
    ];
    case 'last_seen': return [
      { value: 'within_days', label: 'within last (days)' },
      { value: 'before_days', label: 'more than (days) ago' },
      { value: 'never', label: 'never' },
    ];
    case 'created': return [
      { value: 'within_days', label: 'within last (days)' },
      { value: 'before_days', label: 'more than (days) ago' },
    ];
    case 'name': return [
      { value: 'contains', label: 'contains' },
      { value: 'equals', label: 'equals' },
      { value: 'starts_with', label: 'starts with' },
    ];
    case 'channel': return [{ value: 'is', label: 'is' }];
  }
}

export default function SegmentRuleRow({ rule, onChange, onRemove }: SegmentRuleRowProps) {
  const handleFieldChange = (field: SegmentRule['field']) => {
    let next: SegmentRule;
    if (field === 'tag') next = { field, op: 'has_any_of', value: [] };
    else if (field === 'last_seen') next = { field, op: 'within_days', value: 30 };
    else if (field === 'created') next = { field, op: 'within_days', value: 30 };
    else if (field === 'name') next = { field, op: 'contains', value: '' };
    else next = { field: 'channel', op: 'is', value: 'whatsapp' };
    onChange(next);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-[#1a1915] border border-[#2d2813] rounded-xl">
      <select value={rule.field} onChange={e => handleFieldChange(e.target.value as SegmentRule['field'])}
        className="px-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg font-bold">
        {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={rule.op} onChange={e => onChange({ ...rule, op: e.target.value as SegmentRule['op'] } as SegmentRule)}
        className="px-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg">
        {opsFor(rule.field).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <RuleValueEditor rule={rule} onChange={onChange} />
      <button onClick={onRemove} className="p-1 text-[#6e684a] hover:text-red-400 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
