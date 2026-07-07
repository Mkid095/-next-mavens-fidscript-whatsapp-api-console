import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { platformApi } from '../../data/api/platform.js';
import { useAgentPermissions } from '../../data/hooks/agents/useAgents.js';
import type { Agent } from '../../data/api/platform.js';

// Phase 4 — single-agent editor inline within the agent list. Shows description,
// model, and the allow-list from the action catalog. Each toggle hits
// canAgent() server-side; denials are audited (§10.2).
interface AgentEditorProps { agent: Agent; }

export default function AgentEditor({ agent }: AgentEditorProps) {
  const [description, setDescription] = useState(agent.description ?? '');
  const [enabled, setEnabled] = useState(agent.enabled);
  const { granted, catalog, grant, revoke } = useAgentPermissions(agent.id);
  const [checkAction, setCheckAction] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  useEffect(() => { setDescription(agent.description ?? ''); setEnabled(agent.enabled); }, [agent.id, agent.description, agent.enabled]);

  const onCheck = async (action: string) => {
    setCheckAction(action);
    const res = await platformApi.canAgent(agent.id, action);
    setCheckResult(res.success && res.data ? res.data.allowed : null);
    setTimeout(() => { setCheckAction(null); setCheckResult(null); }, 1500);
  };

  const save = async () => {
    await platformApi.updateAgent(agent.id, { description, enabled });
  };

  return (
    <div className="border-t border-stone-200 bg-white p-3 text-xs">
      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-stone-500 col-span-2">
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} onBlur={save}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep" />
        </label>
        <label className="flex items-center gap-2 text-stone-700">
          <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); save(); }} />
          Enabled
        </label>
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">Permissions</p>
      <div className="flex flex-wrap gap-1">
        {catalog.map((action) => {
          const has = granted.includes(action);
          const checking = checkAction === action;
          return (
            <button
              key={action}
              onClick={() => { has ? revoke(action) : grant(action); onCheck(action); }}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition ${
                has ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {checking && checkResult !== null
                ? (checkResult ? <CheckCircle2 size={9} /> : <XCircle size={9} />)
                : null}
              {action}
            </button>
          );
        })}
      </div>
    </div>
  );
}
