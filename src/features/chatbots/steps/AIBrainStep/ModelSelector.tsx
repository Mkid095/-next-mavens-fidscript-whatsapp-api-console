import React from 'react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { type AIProvider } from '../../types';

const MODEL_SUGGESTIONS: Record<AIProvider, string[]> = {
  fidscript:   ['gemini-2.0-flash', 'gemini-1.5-pro'],
  openai:      ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
  anthropic:   ['claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  gemini:      ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.5-pro'],
  openrouter:  ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini'],
  ollama:      ['llama3.2:latest', 'qwen2.5:latest'],
  custom:      [],
};

export function ModelSelector() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;
  const modelSuggestions = MODEL_SUGGESTIONS[aiBrain.provider] ?? [];

  return (
    <div>
      <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
        Model
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={aiBrain.model}
          onChange={(e) => updateAIBrain({ model: e.target.value })}
          placeholder="e.g. gemini-2.0-flash, gpt-4o-mini"
          className="flex-1 bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-2.5 text-white text-sm font-mono placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none"
        />
      </div>
      {modelSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {modelSuggestions.map((m) => (
            <button
              key={m}
              onClick={() => updateAIBrain({ model: m })}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition ${
                aiBrain.model === m
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-[#1a1915] text-[#6e684a] border border-[#2d2813] hover:border-[#3d3823]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
