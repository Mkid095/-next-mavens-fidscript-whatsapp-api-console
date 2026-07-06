import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { useFlow } from '../../data/hooks/useFlows.js';
import { platformApi } from '../../data/api/platform.js';
import type { FlowNodeInput, FlowEdgeInput } from '../../data/api/platform.js';

// Phase 4 — minimal flow editor: linear trigger → condition → action form
// over the canonical DAG. Each "add node" appends to the last action node;
// "save" replaces the graph atomically on the server.
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
    // Rebuild edges: trigger → next, each subsequent → next (linear).
    const edges: FlowEdgeInput[] = [];
    for (let i = 0; i < draft.length - 1; i++) {
      edges.push({ from: draft[i].id ?? '', to: draft[i + 1].id ?? '' });
    }
    await platformApi.updateFlow(flowId, { nodes: draft, edges });
    setDraft(null);
    await refresh();
    setSaving(false);
  };

  const addNode = (type: NodeType) => {
    const next = [...nodes, newNode(type, nodes.length)];
    setNodes(next);
  };

  const removeNode = (idx: number) => {
    if (idx === 0) return; // never remove the trigger
    setNodes(nodes.filter((_, i) => i !== idx));
  };

  const updateNode = (idx: number, patch: Partial<FlowNodeInput>) => {
    setNodes(nodes.map((n, i) => i === idx ? { ...n, ...patch } : n));
  };

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
      <button
        onClick={save}
        disabled={saving || !draft}
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-forest-deep py-1.5 text-xs text-white disabled:opacity-50"
      >
        <Save size={12} /> {saving ? 'Saving…' : (draft ? 'Save changes' : 'No changes')}
      </button>
    </div>
  );
}

function NodeConfigForm({ node, onChange }: { node: FlowNodeInput; onChange: (patch: Partial<FlowNodeInput>) => void }) {
  const cfg = (node.config ?? {}) as Record<string, unknown>;
  switch (node.type) {
    case 'trigger':
      return (
        <div className="text-[10px] text-stone-500">
          Trigger on <span className="font-mono">{String(cfg.event ?? 'message.received')}</span>
        </div>
      );
    case 'condition':
      return (
        <div className="grid grid-cols-3 gap-1">
          <input value={String(cfg.field ?? '')} onChange={(e) => onChange({ config: { ...cfg, field: e.target.value } })}
            placeholder="field" className="rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          <select value={String(cfg.op ?? 'contains')} onChange={(e) => onChange({ config: { ...cfg, op: e.target.value } })}
            className="rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep">
            {['equals', 'contains', 'starts_with', 'regex'].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input value={String(cfg.value ?? '')} onChange={(e) => onChange({ config: { ...cfg, value: e.target.value } })}
            placeholder="value" className="rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
        </div>
      );
    case 'action': {
      const args = (cfg.args ?? {}) as Record<string, string>;
      return (
        <div className="grid grid-cols-2 gap-1">
          <select value={String(cfg.kind ?? 'add_tag')} onChange={(e) => onChange({ config: { ...cfg, kind: e.target.value } })}
            className="col-span-2 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep">
            {['add_tag', 'assign_team', 'set_priority', 'set_status', 'send_message'].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          {cfg.kind === 'add_tag' && (
            <input value={args.tag ?? ''} onChange={(e) => onChange({ config: { ...cfg, args: { ...args, tag: e.target.value } } })}
              placeholder="tag" className="col-span-2 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          )}
          {cfg.kind === 'assign_team' && (
            <input value={args.team_id ?? ''} onChange={(e) => onChange({ config: { ...cfg, args: { ...args, team_id: e.target.value } } })}
              placeholder="team id" className="col-span-2 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          )}
          {(cfg.kind === 'set_priority' || cfg.kind === 'set_status') && (
            <input value={args.value ?? ''} onChange={(e) => onChange({ config: { ...cfg, args: { ...args, value: e.target.value } } })}
              placeholder={String(cfg.kind).replace('set_', '')} className="col-span-2 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          )}
          {cfg.kind === 'send_message' && (
            <input value={args.body ?? ''} onChange={(e) => onChange({ config: { ...cfg, args: { ...args, body: e.target.value } } })}
              placeholder="message body" className="col-span-2 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          )}
        </div>
      );
    }
    case 'wait':
      return (
        <div className="flex items-center gap-1 text-[10px] text-stone-500">
          wait
          <input type="number" min={1} value={Number(cfg.minutes ?? 60)} onChange={(e) => onChange({ config: { ...cfg, minutes: Number(e.target.value) } })}
            className="w-16 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] outline-none focus:border-forest-deep" />
          minutes
        </div>
      );
    case 'branch':
    case 'ai':
      return <div className="text-[10px] text-stone-500">Advanced config — edit JSON for now</div>;
  }
}
