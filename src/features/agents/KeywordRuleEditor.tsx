import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { useAIRules } from '../../data/hooks/useAIRules.js';

const STATES = ['ai_active', 'ai_paused', 'human_active', 'escalated'] as const;

// Phase 4 — keyword rule editor (§10.1). One row per rule: keyword + reply +
// confidence + escalation behavior. Mirrors the AI inbound pipeline config.
export default function KeywordRuleEditor() {
  const { rules, create, remove } = useAIRules();
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [state, setState] = useState<(typeof STATES)[number]>('escalated');

  const onCreate = async () => {
    if (!keyword.trim() || !reply.trim()) return;
    await create({ keyword: keyword.trim(), reply: reply.trim(), confidence_threshold: threshold, set_ai_state: state, enabled: true });
    setKeyword(''); setReply('');
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <Zap size={12} /> Keyword rules
      </div>
      <p className="mb-3 text-[11px] text-stone-500">
        When an inbound message matches a keyword, the AI replies with the rule's text. If the rule sets a state, the conversation moves there.
      </p>
      <div className="mb-3 space-y-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="keyword…"
            className="col-span-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep" />
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="reply…"
            className="col-span-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep" />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex flex-1 items-center gap-1.5 text-[10px] text-stone-500">
            threshold
            <input type="number" step={0.05} min={0} max={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-16 rounded border border-stone-200 bg-stone-50 px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          </label>
          <select value={state} onChange={(e) => setState(e.target.value as (typeof STATES)[number])}
            className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] outline-none focus:border-forest-deep">
            {STATES.map((s) => <option key={s} value={s}>→ {s}</option>)}
          </select>
          <button onClick={onCreate} disabled={!keyword.trim() || !reply.trim()}
            className="flex items-center gap-1 rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>
      <ul className="space-y-1">
        {rules.length === 0 ? (
          <li className="text-[11px] text-stone-400">No rules yet</li>
        ) : rules.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-stone-800">“{r.keyword}” → “{r.reply}”</p>
              <p className="text-[10px] text-stone-500">threshold {r.confidence_threshold} · → {r.set_ai_state ?? 'ai_active'} · {r.enabled ? 'on' : 'off'}</p>
            </div>
            <button onClick={() => remove(r.id)} aria-label="Delete rule" className="shrink-0 text-stone-400 hover:text-red-600">
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
