import { useState } from 'react';
import { Plus, Trash2, Workflow } from 'lucide-react';
import { useFlows } from '../../data/hooks/automation/useFlows.js';
import AutomationEditor from './AutomationEditor.js';

// Phase 4 — flow list (§11). A flow is a graph of trigger/condition/action
// nodes. The editor expands inline; the DAG is stored canonically on the
// server (automation_edges) and this list just shows summary.
export default function AutomationList() {
  const { flows, create, remove } = useFlows();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const onCreate = async () => {
    const n = name.trim();
    if (!n) return;
    setName('');
    // Seed with a single trigger node so the user can immediately add actions
    const seedNode = { id: 'trigger1', type: 'trigger' as const, config: { event: 'message.received' } };
    const res = await create({ name: n, nodes: [seedNode], edges: [] });
    if (res.success && res.data) setEditingId(res.data.id);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <Workflow size={12} /> Automations
      </div>
      <p className="mb-3 text-[11px] text-stone-500">
        Flows = trigger → condition → action graphs. The engine subscribes to message.received and walks the DAG for every flow that matches.
      </p>
      <div className="mb-3 flex items-center gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }}
          placeholder="New flow name…"
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
        />
        <button onClick={onCreate} disabled={!name.trim()}
          className="flex items-center gap-1 rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50">
          <Plus size={12} /> Add
        </button>
      </div>
      <ul className="space-y-1">
        {flows.length === 0 ? (
          <li className="text-[11px] text-stone-400">No flows yet</li>
        ) : flows.map((f) => (
          <li key={f.id} className="rounded-lg border border-stone-200 bg-stone-50">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <button onClick={() => setEditingId(editingId === f.id ? null : f.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-medium text-stone-800">{f.name}</p>
                <p className="text-[10px] text-stone-400">{f.trigger_event} · {f.enabled ? 'on' : 'off'} · v{f.version}</p>
              </button>
              <button onClick={() => remove(f.id)} aria-label="Delete flow" className="text-stone-400 hover:text-red-600">
                <Trash2 size={12} />
              </button>
            </div>
            {editingId === f.id && <AutomationEditor flowId={f.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
