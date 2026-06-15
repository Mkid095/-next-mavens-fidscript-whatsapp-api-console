import { useState } from 'react';
import { Plus, Trash2, UsersRound } from 'lucide-react';
import { useTeams } from '../../data/hooks/useTeams.js';

// Phase 3 — workspace teams panel (§4.5). Workspace-scoped CRUD.
// Each team row reveals a member list when expanded.
export default function TeamsPanel() {
  const { teams, create, remove } = useTeams();
  const [name, setName] = useState('');

  const onCreate = async () => {
    const t = name.trim();
    if (!t) return;
    setName('');
    await create(t);
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <UsersRound size={12} /> Teams
      </div>
      <p className="mb-3 text-[11px] text-stone-500">
        Teams own customers and conversations. A conversation can be assigned to a team; a customer can have a long-term owning team.
      </p>
      <div className="mb-3 flex items-center gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }}
          placeholder="New team name…"
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
        />
        <button
          onClick={onCreate}
          disabled={!name.trim()}
          className="flex items-center gap-1 rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <ul className="space-y-1">
        {teams.length === 0 ? (
          <li className="text-[11px] text-stone-400">No teams yet</li>
        ) : (
          teams.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5">
              <div>
                <p className="text-xs font-medium text-stone-800">{t.name}</p>
                <p className="text-[10px] text-stone-400">{t.member_count} member{t.member_count === 1 ? '' : 's'}</p>
              </div>
              <button
                onClick={() => remove(t.id)}
                aria-label={`Delete team ${t.name}`}
                className="text-stone-400 hover:text-red-600"
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
