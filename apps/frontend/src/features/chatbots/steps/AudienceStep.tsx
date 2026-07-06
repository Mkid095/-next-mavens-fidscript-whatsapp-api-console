/**
 * AudienceStep — Step 2 of the Chatbot Builder.
 *
 * Answers: "Who should this chatbot talk to?"
 *
 * Sections:
 * - Contacts: Who (Everyone, New, Existing, Tagged, Specific, Whitelist, Blacklist)
 * - Groups: How in WhatsApp groups (Disabled, Mention, Reply All, Admin Only)
 */
import React from 'react';
import { Users, MessageSquare, ChevronRight, Check, Globe, Sparkles, RefreshCw, Tag, User } from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { type AudienceContactMode, type GroupMode } from '../types';

const CONTACT_OPTIONS: { value: AudienceContactMode; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'everyone',           label: 'Everyone',           description: 'All contacts that message your WhatsApp', icon: Globe },
  { value: 'new-contacts',       label: 'New Contacts',       description: 'Contacts messaging for the first time', icon: Sparkles },
  { value: 'existing-customers', label: 'Existing Customers', description: 'Contacts with prior conversation history', icon: RefreshCw },
  { value: 'tagged-contacts',    label: 'Tagged Contacts',   description: 'Contacts with specific tags', icon: Tag },
  { value: 'specific-contacts',  label: 'Specific Contacts', description: 'Manually selected contacts', icon: User },
];

const GROUP_OPTIONS: { value: GroupMode; label: string; description: string }[] = [
  { value: 'disabled',            label: 'Disabled',           description: 'Bot will not respond in groups' },
  { value: 'mention-only',        label: 'Mention Only',       description: 'Respond when @mentioned' },
  { value: 'reply-to-all',        label: 'Reply to Everyone',  description: 'Respond to all messages (use carefully)' },
  { value: 'admin-messages-only', label: 'Admin Messages Only', description: 'Only respond to group admins' },
];

export default function AudienceStep() {
  const { draft, updateAudience } = useChatbotBuilderStore();
  const { audience } = draft;

  return (
    <div className="space-y-10">
      {/* ── Section: Who should this bot talk to? ─────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Contacts</h3>
        </div>
        <p className="text-xs text-[#8f834a] mb-4">
          Define which contacts this chatbot will respond to.
        </p>

        <div className="space-y-2">
          {CONTACT_OPTIONS.map((opt) => {
            const isSelected = audience.contactMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateAudience({ contactMode: opt.value })}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <span className={isSelected ? 'text-yellow-400' : 'text-[#6e684a]'}>
                  {(() => { const Icon = opt.icon; return <Icon size={16} />; })()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-[#6e684a]">{opt.description}</p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-yellow-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tag input for tagged-contacts */}
        {audience.contactMode === 'tagged-contacts' && (
          <div className="mt-3 pl-1">
            <label className="block text-xs text-[#8f834a] mb-1.5">Tags</label>
            <input
              type="text"
              placeholder="Type a tag and press Enter"
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !audience.tags.includes(val)) {
                    updateAudience({ tags: [...audience.tags, val] });
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            {audience.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {audience.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#2d2813] rounded-full text-xs text-[#a8a99e]"
                  >
                    {tag}
                    <button
                      onClick={() => updateAudience({ tags: audience.tags.filter(t => t !== tag) })}
                      className="text-[#6e684a] hover:text-white transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section: How should it behave in groups? ─────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">WhatsApp Groups</h3>
        </div>
        <p className="text-xs text-[#8f834a] mb-4">
          Configure how this bot behaves in WhatsApp group chats.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GROUP_OPTIONS.map((opt) => {
            const isSelected = audience.groupMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateAudience({ groupMode: opt.value })}
                className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-yellow-400 bg-yellow-400' : 'border-[#3d3823]'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-[#6e684a] mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Priority note ─────────────────────────────────────────────── */}
      <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
        <p className="text-xs text-[#8f834a]">
          <span className="text-yellow-400 font-semibold">Priority: {audience.priority}</span>
          {' '}— If multiple chatbots match the same conversation, the one with the higher priority wins.
          <button
            onClick={() => {
              const next = audience.priority >= 90 ? 10 : audience.priority + 10;
              updateAudience({ priority: next });
            }}
            className="ml-2 text-yellow-400 underline text-[10px]"
          >
            Adjust
          </button>
        </p>
      </div>
    </div>
  );
}
