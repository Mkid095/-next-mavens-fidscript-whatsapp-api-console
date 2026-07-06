/* AudienceStep/index.tsx — Thin shell: owns audience state, renders form */
import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { ResponseScope } from '../types';
import { ScopePicker } from './ScopePicker';
import { ContactPicker } from './ContactPicker';
import { GroupPicker } from './GroupPicker';

export default function AudienceStep() {
  const { draft, updateAudience } = useChatbotBuilderStore();
  const { audience } = draft;

  const [contactIds, setContactIds] = useState<string[]>(audience.contactIds);
  const [groupIds, setGroupIds] = useState<string[]>(audience.groupIds);

  // Sync local state → store when changed
  useEffect(() => { updateAudience({ contactIds }); }, [contactIds]); // eslint-disable-line
  useEffect(() => { updateAudience({ groupIds }); }, [groupIds]); // eslint-disable-line

  const toggleContact = (id: string) => {
    setContactIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleGroup = (id: string) => {
    setGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleScopeChange = (scope: ResponseScope) => {
    updateAudience({ responseScope: scope });
  };

  return (
    <div className="space-y-8">
      {/* Scope selector */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Where should this bot respond?</h3>
        </div>
        <p className="text-xs text-[#8f834a] mb-4">Choose which conversations this chatbot will handle.</p>
        <ScopePicker value={audience.responseScope} onChange={handleScopeChange} />
      </div>

      {/* Contact picker */}
      {audience.responseScope === 'specific-contacts' && (
        <ContactPicker
          selectedIds={contactIds}
          onToggle={toggleContact}
          allowNew={audience.allowNewContacts}
          onAllowNewChange={(v) => updateAudience({ allowNewContacts: v })}
        />
      )}

      {/* Group picker */}
      {audience.responseScope === 'specific-groups' && (
        <GroupPicker selectedIds={groupIds} onToggle={toggleGroup} />
      )}

      {/* Priority */}
      <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#8f834a]">
            <span className="text-yellow-400 font-semibold">Priority: {audience.priority}</span>
          </p>
          <button
            onClick={() => {
              const next = audience.priority >= 90 ? 10 : audience.priority + 10;
              updateAudience({ priority: next });
            }}
            className="text-yellow-400 underline text-[10px]"
          >
            Adjust
          </button>
        </div>
        <p className="text-[10px] text-[#6e684a]">
          If multiple chatbots match the same conversation, the one with the higher priority wins.
        </p>
      </div>
    </div>
  );
}
