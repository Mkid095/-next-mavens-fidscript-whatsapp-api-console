import { useState } from 'react';
import { UserCog } from 'lucide-react';
import { useAssignment } from '../../data/hooks/customers/useAssignment.js';
import { useTeams } from '../../data/hooks/customers/useTeams.js';

// Phase 3 - long-term customer owner (§6.1 customer_assignments + §9).
// Distinct from the conversation-level assignee: a customer may be owned by
// Sales even when their current conversation is unassigned.
export default function AssignmentPanel({ customerId }: { customerId: string }) {
  const { assignment, set } = useAssignment(customerId);
  const { teams } = useTeams();
  const [teamId, setTeamId] = useState<string>(assignment?.team_id ?? '');
  const [saving, setSaving] = useState(false);

  // Keep the local select in sync when the server data arrives/changes
  if (assignment && assignment.team_id !== teamId && !saving) {
    setTeamId(assignment.team_id ?? '');
  }

  const onSave = async () => {
    setSaving(true);
    await set({ team_id: teamId || null, owner_user_id: null });
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <UserCog size={12} /> Account owner
      </div>
      <p className="mb-2 text-[11px] text-stone-500">
        {assignment?.team_name
          ? `Currently owned by ${assignment.team_name}`
          : 'Unassigned - pick a team to take long-term ownership.'}
      </p>
      <div className="flex items-center gap-1.5">
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
        >
          <option value="">- Unassigned -</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button
          onClick={onSave}
          disabled={saving || teamId === (assignment?.team_id ?? '')}
          className="rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
