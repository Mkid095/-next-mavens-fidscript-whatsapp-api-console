import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { useFlow } from '../../../data/hooks/useFlows.js';
import { platformApi } from '../../../data/api/platform.js';
import type { FlowNodeInput, FlowEdgeInput } from '../../../data/api/platform.js';
import { NodeConfigForm } from './AutomationForm.js';

const NODE_TYPES = ['condition', 'action', 'wait', 'branch', 'ai'] as const;
type NodeType = typeof NODE_TYPES[number];

function newNode(type: NodeType, idx: number): FlowNodeInput {
  const id = `${type}_${Date.now()}_${idx}`;
  switch (type) {
    case 'condition': return { id, type, config: { field: 'content', op: 'contains', value: '' } };
    case 'action': return { id, type, config: { kind: 'add_tag', args: { tag: '' } } };
    case 'wait': return { id, type, config: { minutes: 60 } };
    case 'branch': return { id, type, config: { branches: [{ label: 'true', condition: { field: 'content', op: 'contains', value: '' } }] } };
    case 'ai': return { id, type, config: { agentId: '' } };
  }
}

export default function AutomationEditor({ flowId }: { flowId: string }) {
  const { flow, refresh } = useFlow(flowId);
  const [draft, setDraft] = useState<FlowNodeInput[] | null>(null);
  const [saving, setSaving] = useState(false);

  if (!flow) return <div className="border-t border-stone-200 p-3 text-[11px] text-stone-400">Loading…</div>;

  const nodes = draft ?? (flow.nodes as FlowNodeInput[]);
  const setNodes = (next: FlowNodeInput[]) => setDraft(next);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const edges: FlowEdgeInput[] = [];
    for (let i = 0; i < draft.length - 1; i++) {
      edges.push({ from: draft[i].id ?? '', to: draft[i + 1].id ?? '' });
    }
    await platformApi.updateFlow(flowId, { nodes: draft, edges });
    setDraft(null);
    await refresh();
    setSaving(false);
  };

  const addNode = (type: NodeType) => setNodes([...nodes, newNode(type, nodes.length)]);
  const removeNode = (idx: number) => { if (idx === 0) return; setNodes(nodes.filter((_, i) => i !== idx)); };
  const updateNode = (idx: number, patch: Partial<FlowNodeInput>) => setNodes(nodes.map((n, i) => i === idx ? { ...n, ...patch } : n));

  return (
    <div className="border-t border-stone-200 bg-white p-3">
      <ol className="mb-2 space-y-1.5">
        {nodes.map((n, idx) => (
          <li key={n.id ?? idx} className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-stone-500">{n.type}{idx === 0 ? ' (entry)' : ''}</span>
              {idx > 0 && (
                <button onClick={() => removeNode(idx)} className="text-stone-400 hover:text-red-600" aria-label="Remove node">
                  <X size={10} />
                </button>
              )}
            </div>
            <NodeConfigForm node={n} onChange={(patch) => updateNode(idx, patch)} />
          </li>
        ))}
      </ol>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <span className="text-[10px] text-stone-500">Add:</span>
        {NODE_TYPES.map((t) => (
          <button key={t} onClick={() => addNode(t)} className="flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600 hover:bg-stone-200">
            <Plus size={9} /> {t}
          </button>
        ))}
      </div>
      <button onClick={save} disabled={saving || !draft}
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-forest-deep py-1.5 text-xs text-white disabled:opacity-50">
        <Save size={12} /> {saving ? 'Saving…' : (draft ? 'Save changes' : 'No changes')}
      </button>
    </div>
  );
}
