import { useState } from 'react';
import { Bot, Plus, Trash2 } from 'lucide-react';
import { useAgents } from '../../data/hooks/agents/useAgents.js';
import AgentEditor from './AgentEditor.js';

// Phase 4 - agent registry list (§10.4). One component = list + create
// affordance + click-to-edit. Editing expands the AgentEditor inline.
export default function AgentList() {
  const { agents, create, remove } = useAgents();
  const [draftName, setDraftName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const onCreate = async () => {
    const name = draftName.trim();
    if (!name) return;
    setDraftName('');
    const res = await create({ name });
    if (res.success && res.data) setEditingId(res.data.id);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <Bot size={12} /> AI agents
      </div>
      <p className="mb-3 text-[11px] text-stone-500">
        Agents are governed AI responders. Each agent gets an explicit allow-list from the action catalog - anything not granted is denied and audited.
      </p>
      <div className="mb-3 flex items-center gap-1.5">
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }}
          placeholder="New agent name…"
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
        />
        <button
          onClick={onCreate}
          disabled={!draftName.trim()}
          className="flex items-center gap-1 rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <ul className="space-y-1">
        {agents.length === 0 ? (
          <li className="text-[11px] text-stone-400">No agents yet</li>
        ) : (
          agents.map((a) => (
            <li key={a.id} className="rounded-lg border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <button
                  onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-xs font-medium text-stone-800">{a.name}</p>
                  <p className="truncate text-[10px] text-stone-400">
                    {a.enabled ? 'Enabled' : 'Disabled'} · {(a.permissions ?? []).length} permissions
                  </p>
                </button>
                <button onClick={() => remove(a.id)} aria-label={`Delete agent ${a.name}`} className="text-stone-400 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
              {editingId === a.id && <AgentEditor agent={a} />}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
