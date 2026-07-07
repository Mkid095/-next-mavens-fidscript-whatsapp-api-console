import React from 'react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';

export function SystemPromptEditor() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain, general } = draft;

  return (
    <div>
      <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
        System Prompt
      </label>
      <textarea
        value={aiBrain.systemPrompt}
        onChange={(e) => updateAIBrain({ systemPrompt: e.target.value })}
        placeholder={`You are a helpful ${general.template !== 'custom' ? general.template.replace('-', ' ') : 'assistant'} for ${general.name || 'your business'}.\n\nBe friendly, professional, and concise.`}
        rows={6}
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none resize-none"
      />
      <div className="flex justify-between items-center mt-1.5">
        <p className="text-[10px] text-[#6e684a]">
          This shapes how the AI responds. Be specific about tone, knowledge boundaries, and responsibilities.
        </p>
        <span className="text-[10px] text-[#5a554a] font-mono">{aiBrain.systemPrompt.length} chars</span>
      </div>
    </div>
  );
}
