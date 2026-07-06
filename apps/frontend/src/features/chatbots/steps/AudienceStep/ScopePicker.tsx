import React from 'react';
import { Check, Globe, User, Users2, MessageSquare } from 'lucide-react';
import { type ResponseScope } from '../types';

const SCOPE_OPTIONS: { value: ResponseScope; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'all',                label: 'All Chats',          description: 'Respond to all messages — DMs and groups', icon: Globe },
  { value: 'dm-only',            label: 'Direct Messages',    description: 'Only respond in 1-on-1 conversations', icon: User },
  { value: 'groups-only',        label: 'Groups Only',        description: 'Only respond in group chats', icon: Users2 },
  { value: 'specific-contacts',  label: 'Specific Contacts',  description: 'Only respond to selected contacts', icon: Users },
  { value: 'specific-groups',    label: 'Specific Groups',    description: 'Only respond in selected contact groups', icon: MessageSquare },
];

interface ScopePickerProps {
  value: ResponseScope;
  onChange: (scope: ResponseScope) => void;
}

export function ScopePicker({ value, onChange }: ScopePickerProps) {
  return (
    <div className="space-y-2">
      {SCOPE_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
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
            {isSelected && <Check className="w-4 h-4 text-yellow-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
