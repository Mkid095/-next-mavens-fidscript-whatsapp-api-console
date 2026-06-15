import { useState } from 'react';
import { ArrowDown, ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import type { CampaignStep, StepActionType, StepActionConfig } from '../../data/api/platform.js';

const ACTION_OPTIONS: { value: StepActionType; label: string; hint: string }[] = [
  { value: 'send_text', label: 'Send text', hint: 'Text message to the customer' },
  { value: 'send_media', label: 'Send media', hint: 'Image/video/document with optional caption' },
  { value: 'add_tag', label: 'Add tag', hint: 'Tag the customer for segmentation' },
  { value: 'set_status', label: 'Set status', hint: 'Set conversation status on the open chat' },
  { value: 'wait_branch', label: 'Wait branch', hint: 'Conditional wait before next step' },
];

/** Single step row in the drip flow editor. Expandable body with the
 *  action-specific config editor. Renders the row collapsed by default. */
export default function StepRow({ step, index, onChange, onDelete }: {
  step: CampaignStep;
  index: number;
  onChange: (s: CampaignStep) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = step.action_config || {};

  const updateCfg = (patch: Partial<StepActionConfig>) =>
    onChange({ ...step, action_config: { ...cfg, ...patch } });

  return (
    <div className="border border-[#eaebe4] rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <GripVertical className="w-3.5 h-3.5 text-stone-300" />
        <div className="w-6 h-6 rounded-full bg-forest-deep text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</div>
        <select
          value={step.action_type}
          onChange={e => onChange({ ...step, action_type: e.target.value as StepActionType, action_config: defaultConfigFor(e.target.value as StepActionType) })}
          className="text-xs border border-[#eaebe4] bg-white rounded-lg px-2 py-1 font-bold"
        >
          {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-[10px] text-stone-500 truncate flex-1">{ACTION_OPTIONS.find(o => o.value === step.action_type)?.hint}</span>
        <div className="flex items-center gap-1 text-[10px] text-stone-500">
          <ArrowDown className="w-3 h-3" />
          <input
            type="number" min={0} value={step.delay_seconds}
            onChange={e => onChange({ ...step, delay_seconds: Math.max(0, Number(e.target.value)) })}
            className="w-14 px-1.5 py-0.5 text-[10px] border border-[#eaebe4] bg-white rounded font-mono"
          />
          <span>sec</span>
        </div>
        <button onClick={() => setOpen(o => !o)} className="p-1 text-stone-400 hover:text-stone-700">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={onDelete} className="p-1 text-stone-400 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2.5 border-t border-[#eaebe4] bg-[#f9f9f2]">
          <ActionConfigEditor type={step.action_type} cfg={cfg} onChange={updateCfg} />
        </div>
      )}
    </div>
  );
}

function defaultConfigFor(type: StepActionType): StepActionConfig {
  if (type === 'send_text') return { text: '' };
  if (type === 'send_media') return { media_url: '', caption: '' };
  if (type === 'add_tag') return { tag: '' };
  if (type === 'set_status') return { status: 'pending' };
  return { delay_seconds: 0 };
}

function ActionConfigEditor({ type, cfg, onChange }: { type: StepActionType; cfg: StepActionConfig; onChange: (p: Partial<StepActionConfig>) => void }) {
  if (type === 'send_text') {
    return (
      <textarea value={cfg.text || ''} onChange={e => onChange({ text: e.target.value })} rows={2} placeholder="Text to send…"
        className="w-full px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg" />
    );
  }
  if (type === 'send_media') {
    return (
      <div className="space-y-1.5">
        <input value={cfg.media_url || ''} onChange={e => onChange({ media_url: e.target.value })} placeholder="https://… (image/video URL)"
          className="w-full px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg font-mono" />
        <input value={cfg.caption || ''} onChange={e => onChange({ caption: e.target.value })} placeholder="Optional caption"
          className="w-full px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg" />
      </div>
    );
  }
  if (type === 'add_tag') {
    return (
      <input value={cfg.tag || ''} onChange={e => onChange({ tag: e.target.value })} placeholder="tag-name"
        className="w-full px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg font-mono" />
    );
  }
  if (type === 'set_status') {
    return (
      <select value={cfg.status || 'pending'} onChange={e => onChange({ status: e.target.value as 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed' })}
        className="w-full px-2 py-1.5 text-xs border border-[#eaebe4] bg-white rounded-lg">
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="waiting_on_customer">Waiting on customer</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
    );
  }
  return <p className="text-[10px] text-stone-500">No additional config for wait steps — only delay_seconds matters.</p>;
}
