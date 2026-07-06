import React from 'react';
import { Users } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { HandoffTrigger } from '../../types';
import { SectionWrapper } from './SectionWrapper';

const HANDOFF_TRIGGERS: { id: HandoffTrigger; label: string }[] = [
  { id: 'customer-requests', label: 'Customer asks for human' },
  { id: 'low-confidence', label: 'Low AI confidence' },
  { id: 'negative-sentiment', label: 'Negative sentiment' },
  { id: 'too-many-messages', label: 'Too many retries' },
  { id: 'tool-failure', label: 'Tool execution fails' },
  { id: 'keyword-escalate', label: 'Escalation keyword' },
];

export function HumanHandoffSection() {
  const { draft, updateHandoff } = useChatbotBuilderStore();

  const toggleTrigger = (trigger: HandoffTrigger) => {
    const next = draft.handoff.triggers.includes(trigger)
      ? draft.handoff.triggers.filter(t => t !== trigger)
      : [...draft.handoff.triggers, trigger];
    updateHandoff({ triggers: next });
  };

  return (
    <SectionWrapper icon={Users} title="Human Handoff" description="When should the bot transfer to a human?">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#8f834a] uppercase tracking-wider">Triggers</p>
        {HANDOFF_TRIGGERS.map(t => {
          const isOn = draft.handoff.triggers.includes(t.id);
          return (
            <label key={t.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isOn} onChange={() => toggleTrigger(t.id)} className="accent-yellow-400" />
              <span className="text-xs text-[#a8a99e]">{t.label}</span>
            </label>
          );
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-[10px] font-bold text-[#8f834a] uppercase tracking-wider mb-1">Max Retries</label>
          <input type="number" min="1" max="10" value={draft.handoff.maxRetries}
            onChange={e => updateHandoff({ maxRetries: parseInt(e.target.value) || 3 })}
            className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#8f834a] uppercase tracking-wider mb-1">Fallback Message</label>
          <input type="text" value={draft.handoff.fallbackReply}
            onChange={e => updateHandoff({ fallbackReply: e.target.value })}
            placeholder="Let me connect you with a team member..."
            className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
        </div>
      </div>
    </SectionWrapper>
  );
}
