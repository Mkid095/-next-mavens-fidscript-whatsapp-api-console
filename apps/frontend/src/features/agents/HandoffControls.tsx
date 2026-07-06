import { useState } from 'react';
import { Hand } from 'lucide-react';
import { platformApi } from '../../data/api/platform.js';
import type { Conversation } from '../../data/api/platform.js';

// Phase 4 — manual handoff controls (§10.3) for a single conversation.
// Buttons flip the ai_state; each transition dispatches ai.state_changed + an
// ai.handoff_requested event when leaving AI.
type AIState = 'ai_active' | 'ai_paused' | 'human_active' | 'escalated';

const TARGETS: AIState[] = ['ai_active', 'ai_paused', 'human_active', 'escalated'];

export default function HandoffControls({ conversation }: { conversation: Conversation }) {
  const [pending, setPending] = useState<AIState | null>(null);

  const handoff = async (state: AIState) => {
    setPending(state);
    await platformApi.handoff({ conversation_id: conversation.id, state, reason: 'manual handoff' });
    setPending(null);
    // The conversation row in the parent should re-fetch on its own; if the
    // page re-fetches, the new ai_state flows in. A dedicated event hook is
    // reserved for the inbox refresh — left as a follow-up if the parent
    // doesn't already re-query.
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <Hand size={12} /> Handoff
      </div>
      <p className="mb-2 text-[11px] text-stone-500">
        Move this conversation between AI and human control. Transitions are audited and reflected in the timeline.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {TARGETS.map((s) => {
          const active = conversation.ai_state === s;
          return (
            <button
              key={s}
              onClick={() => handoff(s)}
              disabled={active || pending !== null}
              className={`rounded-lg px-2 py-1.5 text-[10px] capitalize transition ${
                active
                  ? 'bg-forest-deep text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {pending === s ? '…' : s.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
