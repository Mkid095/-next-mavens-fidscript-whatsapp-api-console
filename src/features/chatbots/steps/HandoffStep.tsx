/**
 * HandoffStep — Step 8 of the Chatbot Builder.
 *
 * Configure when and how the chatbot transfers conversations to humans.
 */
import React from 'react';
import { Users, ArrowRight, Check } from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { type HandoffTrigger } from '../types';

const TRIGGER_OPTIONS: { value: HandoffTrigger; label: string; description: string }[] = [
  { value: 'customer-requests',   label: 'Customer asks for human',   description: 'Customer says "talk to agent", "human", etc.' },
  { value: 'low-confidence',       label: 'Low AI confidence',          description: 'AI confidence score drops below threshold' },
  { value: 'negative-sentiment',    label: 'Negative sentiment',        description: 'Customer appears frustrated or angry' },
  { value: 'too-many-messages',     label: 'Too many retries',          description: 'Bot fails to resolve after multiple attempts' },
  { value: 'tool-failure',          label: 'Tool execution fails',      description: "A tool or action can't be completed" },
  { value: 'keyword-escalate',      label: 'Escalation keyword',        description: 'Custom keyword triggers escalation' },
];

export default function HandoffStep() {
  const { draft, updateHandoff } = useChatbotBuilderStore();
  const { handoff } = draft;

  const toggleTrigger = (trigger: HandoffTrigger) => {
    if (handoff.triggers.includes(trigger)) {
      updateHandoff({ triggers: handoff.triggers.filter(t => t !== trigger) });
    } else {
      updateHandoff({ triggers: [...handoff.triggers, trigger] });
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Transfer Triggers ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowRight className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Transfer Triggers</h3>
        </div>
        <p className="text-xs text-[#8f834a] mb-4">
          The bot will hand off to a human when any of these conditions are met.
        </p>

        <div className="space-y-2">
          {TRIGGER_OPTIONS.map((opt) => {
            const isActive = handoff.triggers.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleTrigger(opt.value)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  isActive ? 'border-yellow-400 bg-yellow-400' : 'border-[#3d3823]'
                }`}>
                  {isActive && <Check className="w-3 h-3 text-black" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-[#a8a99e]'}`}>{opt.label}</p>
                  <p className="text-[10px] text-[#6e684a] mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Max Retries ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Max Retries Before Handoff
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={handoff.maxRetries}
            onChange={e => updateHandoff({ maxRetries: Number(e.target.value) })}
            className="flex-1 accent-yellow-400"
          />
          <span className="text-sm font-bold text-yellow-400 font-mono w-6 text-center">
            {handoff.maxRetries}
          </span>
        </div>
        <p className="text-[10px] text-[#6e684a] mt-1">
          If the bot can't resolve a question after this many attempts, it will offer to connect to a human.
        </p>
      </div>

      {/* ── Fallback Message ────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Fallback Message
        </label>
        <textarea
          value={handoff.fallbackReply}
          onChange={e => updateHandoff({ fallbackReply: e.target.value })}
          rows={3}
          placeholder="I'm not sure I can help with that. Let me connect you with a team member."
          className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none resize-none"
        />
        <p className="text-[10px] text-[#6e684a] mt-1.5">
          Shown when the bot can't answer and before transferring to a human.
        </p>
      </div>

      {/* ── Team / Agent Target ──────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Escalation Target
        </label>
        <input
          value={handoff.targetTeamName}
          onChange={e => updateHandoff({ targetTeamName: e.target.value, targetTeamId: e.target.value })}
          placeholder="e.g. Support Team, sales@example.com"
          className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none"
        />
        <p className="text-[10px] text-[#6e684a] mt-1.5">
          Where should escalated conversations be routed? (Email, team name, or agent ID)
        </p>
      </div>
    </div>
  );
}
