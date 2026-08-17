import type { FlowNodeInput } from '../../../data/api/platform.js';

export { type FlowNodeInput };

export default function ConditionBuilder({ node, onChange }: { node: FlowNodeInput; onChange: (patch: Partial<FlowNodeInput>) => void }) {
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
      return <div className="text-[10px] text-stone-500">Advanced config - edit JSON for now</div>;
  }
}
