import React from 'react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { HallucinationPolicy } from './types';

const HALLUCINATION_OPTIONS: { value: HallucinationPolicy; label: string; description: string }[] = [
  { value: 'strict',    label: 'Knowledge Only',   description: 'Only answers from your knowledge base. Says "I don\'t know" otherwise.' },
  { value: 'balanced',  label: 'Balanced',          description: 'Answers from knowledge when possible, fills gaps intelligently.' },
  { value: 'creative', label: 'Creative',          description: 'Uses general knowledge to supplement your data.' },
];

export default function KnowledgeBoundary() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;

  return (
    <div>
      <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-3">
        Knowledge Boundary
      </label>
      <p className="text-xs text-[#6e684a] mb-2">
        How should the bot handle questions outside its knowledge base?
      </p>
      <div className="space-y-2">
        {HALLUCINATION_OPTIONS.map((opt) => {
          const isSelected = aiBrain.hallucinationPolicy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => updateAIBrain({ hallucinationPolicy: opt.value })}
              className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                isSelected ? 'border-yellow-400 bg-yellow-400' : 'border-[#3d3823]'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
              <div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>{opt.label}</p>
                <p className="text-[10px] text-[#6e684a] mt-0.5">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
