/**
 * AIBrainStep — Step 3 of the Chatbot Builder.
 *
 * Sections:
 * - Provider: Fidscript AI vs Bring Your Own
 * - Model: Select model with context info
 * - Memory: Toggle memory capabilities (user-friendly labels)
 * - System Prompt: Write the bot's personality/instructions
 * - Response Settings: Temperature, hallucination policy (user-friendly)
 */
import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Check, Bot, Sparkles, Cpu, Globe, Monitor, Settings } from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { type AIProvider } from '../types';

const PROVIDERS: { id: AIProvider; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'fidscript',    label: 'Fidscript AI',    description: 'Powered by Gemini — great out of the box', icon: Bot },
  { id: 'openai',       label: 'OpenAI',           description: 'GPT-4o, GPT-4o Mini, o1 & more',          icon: Sparkles },
  { id: 'anthropic',    label: 'Anthropic',        description: 'Claude 3.5 Sonnet, Opus & more',          icon: Cpu },
  { id: 'gemini',       label: 'Google Gemini',    description: 'Gemini 1.5, 2.0 Flash & more',            icon: Globe },
  { id: 'openrouter',   label: 'OpenRouter',       description: 'Access 100+ models via single API',      icon: Monitor },
  { id: 'ollama',       label: 'Ollama',            description: 'Run open-source models locally',         icon: Settings },
  { id: 'custom',       label: 'Custom / BYOLLM',  description: 'Any OpenAI-compatible endpoint',         icon: Settings },
];

const MODEL_SUGGESTIONS: Record<AIProvider, string[]> = {
  'fidscript':    ['gemini-2.0-flash', 'gemini-1.5-pro'],
  'openai':       ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
  'anthropic':    ['claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  'gemini':       ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.5-pro'],
  'openrouter':   ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini'],
  'ollama':       ['llama3.2:latest', 'qwen2.5:latest'],
  'custom':       [],
};

const HALLUCINATION_OPTIONS: { value: AIBrainDraft['hallucinationPolicy']; label: string; description: string }[] = [
  { value: 'strict',    label: 'Knowledge Only',   description: 'Only answers from your knowledge base. Says "I don\'t know" otherwise.' },
  { value: 'balanced',  label: 'Balanced',          description: 'Answers from knowledge when possible, fills gaps intelligently.' },
  { value: 'creative', label: 'Creative',          description: 'Uses general knowledge to supplement your data.' },
];

type AIBrainDraft = ReturnType<typeof useChatbotBuilderStore.getState>['draft']['aiBrain'];

export default function AIBrainStep() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const modelSuggestions = MODEL_SUGGESTIONS[aiBrain.provider] ?? [];

  return (
    <div className="space-y-8">
      {/* ── Provider Selection ─────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-3">
          AI Provider
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROVIDERS.map((p) => {
            const isSelected = aiBrain.provider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => updateAIBrain({
                  provider: p.id,
                  model: MODEL_SUGGESTIONS[p.id]?.[0] ?? '',
                })}
                className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={isSelected ? 'text-yellow-400' : 'text-[#6e684a]'}>
                    {(() => { const Icon = p.icon; return <Icon size={18} />; })()}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                </div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>
                  {p.label}
                </p>
                <p className="text-[10px] text-[#6e684a] leading-tight">{p.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BYOLLM Fields (show when not fidscript) ───────────────────── */}
      {aiBrain.provider !== 'fidscript' && (
        <div className="space-y-3 bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
          <p className="text-xs font-bold text-yellow-400">Bring Your Own Provider</p>
          {aiBrain.provider === 'custom' ? (
            <>
              <div>
                <label className="block text-[10px] text-[#6e684a] mb-1">Provider Name</label>
                <input value={aiBrain.providerName} onChange={e => updateAIBrain({ providerName: e.target.value })}
                  placeholder="e.g. My Custom Model" className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50" />
              </div>
              <div>
                <label className="block text-[10px] text-[#6e684a] mb-1">Base URL</label>
                <input value={aiBrain.baseUrl} onChange={e => updateAIBrain({ baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1" className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50" />
              </div>
              <div>
                <label className="block text-[10px] text-[#6e684a] mb-1">API Key</label>
                <input type="password" value={aiBrain.apiKey} onChange={e => updateAIBrain({ apiKey: e.target.value })}
                  placeholder="sk-..." className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] text-[#6e684a] mb-1">API Key</label>
              <input type="password" value={aiBrain.apiKey} onChange={e => updateAIBrain({ apiKey: e.target.value })}
                placeholder={`Your ${aiBrain.provider} API key`} className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50" />
            </div>
          )}
        </div>
      )}

      {/* ── Model ─────────────────────────────────────────────────────── */}
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

      {/* ── Memory Settings ────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-3">
          Memory Capabilities
        </label>
        <div className="space-y-2">
          {aiBrain.memorySettings.map((setting, idx) => (
            <label
              key={setting.label}
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                setting.enabled
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
              }`}
            >
              <div
                onClick={() => {
                  const next = [...aiBrain.memorySettings];
                  next[idx] = { ...setting, enabled: !setting.enabled };
                  updateAIBrain({ memorySettings: next });
                }}
                className={`w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${
                  setting.enabled ? 'bg-yellow-400' : 'bg-[#2d2813]'
                }`}
              >
                <span
                  className={`block w-4 h-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                    setting.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <div>
                <p className={`text-xs font-semibold ${setting.enabled ? 'text-white' : 'text-[#a8a99e]'}`}>
                  {setting.label}
                </p>
                <p className="text-[10px] text-[#6e684a]">{setting.description}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-[#6e684a] mt-2">
          The bot will remember this information across conversations.
        </p>
      </div>

      {/* ── System Prompt ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          System Prompt
        </label>
        <textarea
          value={aiBrain.systemPrompt}
          onChange={(e) => updateAIBrain({ systemPrompt: e.target.value })}
          placeholder={`You are a helpful ${draft.general.template !== 'custom' ? draft.general.template.replace('-', ' ') : 'assistant'} for ${draft.general.name || 'your business'}.\n\nBe friendly, professional, and concise.`}
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

      {/* ── Advanced (collapsible) ─────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs text-[#6e684a] hover:text-white transition"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Advanced Settings
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Temperature */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-[#8f834a]">Creativity</label>
                <span className="text-[10px] text-yellow-400 font-mono">{aiBrain.temperature}</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={aiBrain.temperature}
                onChange={e => updateAIBrain({ temperature: Number(e.target.value) })}
                className="w-full accent-yellow-400" />
              <div className="flex justify-between text-[10px] text-[#6e684a] mt-0.5">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max output tokens */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-[#8f834a]">Max Response Length</label>
                <span className="text-[10px] text-yellow-400 font-mono">{aiBrain.maxOutputTokens} tokens</span>
              </div>
              <input type="range" min={256} max={4096} step={256} value={aiBrain.maxOutputTokens}
                onChange={e => updateAIBrain({ maxOutputTokens: Number(e.target.value) })}
                className="w-full accent-yellow-400" />
            </div>
          </div>
        )}
      </div>

      {/* ── Knowledge Boundary ─────────────────────────────────────────── */}
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
    </div>
  );
}
