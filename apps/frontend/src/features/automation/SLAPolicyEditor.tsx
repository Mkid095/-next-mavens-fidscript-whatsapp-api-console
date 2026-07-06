import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useSLAPolicies } from '../../data/hooks/useSLAPolicies.js';

// Phase 3 — SLA policy editor (§9.2).
// Each policy = (channel?, priority? → first_response_minutes, resolution_minutes).
// Policies attach automatically to matching conversations and stamp deadlines.
const CHANNELS = ['', 'whatsapp', 'sms', 'email', 'instagram'] as const;
const PRIORITIES = ['', 'urgent', 'high', 'medium', 'low'] as const;

interface DraftPolicy {
  name: string;
  channel: string;
  priority: string;
  first_response_minutes: number;
  resolution_minutes: number;
}

const EMPTY_DRAFT: DraftPolicy = {
  name: '', channel: '', priority: '',
  first_response_minutes: 60, resolution_minutes: 480,
};

export default function SLAPolicyEditor() {
  const { policies, create, remove } = useSLAPolicies();
  const [draft, setDraft] = useState<DraftPolicy>(EMPTY_DRAFT);

  const onCreate = async () => {
    if (!draft.name.trim()) return;
    await create({
      name: draft.name.trim(),
      channel: draft.channel || null,
      priority: draft.priority || null,
      first_response_minutes: draft.first_response_minutes,
      resolution_minutes: draft.resolution_minutes,
    });
    setDraft(EMPTY_DRAFT);
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <ShieldCheck size={12} /> SLA policies
      </div>
      <p className="mb-3 text-[11px] text-stone-500">
        Define response and resolution targets. New conversations that match the channel + priority get deadlines stamped automatically.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Policy name…"
          className="col-span-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
        />
        <select value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep">
          {CHANNELS.map((c) => <option key={c} value={c}>{c || 'any channel'}</option>)}
        </select>
        <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'any priority'}</option>)}
        </select>
        <label className="flex flex-col gap-0.5 text-[11px] text-stone-500">
          First response (min)
          <input type="number" min={1} value={draft.first_response_minutes}
            onChange={(e) => setDraft({ ...draft, first_response_minutes: Number(e.target.value) || 0 })}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep" />
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-stone-500">
          Resolution (min)
          <input type="number" min={1} value={draft.resolution_minutes}
            onChange={(e) => setDraft({ ...draft, resolution_minutes: Number(e.target.value) || 0 })}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep" />
        </label>
        <button
          onClick={onCreate}
          disabled={!draft.name.trim()}
          className="col-span-2 flex items-center justify-center gap-1 rounded-lg bg-forest-deep py-1.5 text-xs text-white disabled:opacity-50"
        >
          <Plus size={12} /> Create policy
        </button>
      </div>

      <ul className="space-y-1.5">
        {policies.length === 0 ? (
          <li className="text-[11px] text-stone-400">No policies yet</li>
        ) : (
          policies.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-stone-800">{p.name}</p>
                <p className="text-[10px] text-stone-500">
                  {p.channel ?? 'any channel'} · {p.priority ?? 'any priority'} · {p.first_response_minutes}m first response · {p.resolution_minutes}m resolution
                </p>
              </div>
              <button onClick={() => remove(p.id)} aria-label={`Delete policy ${p.name}`} className="shrink-0 text-stone-400 hover:text-red-600">
                <Trash2 size={12} />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
