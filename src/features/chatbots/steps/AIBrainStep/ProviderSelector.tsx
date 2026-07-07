import React from 'react';
import { Check, Bot, Sparkles, Cpu, Globe, Monitor, Settings } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { type AIProvider } from '../../types';

const PROVIDERS: { id: AIProvider; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'fidscript',   label: 'Fidscript AI',  description: 'Powered by Gemini — great out of the box',   icon: Bot      },
  { id: 'openai',     label: 'OpenAI',         description: 'GPT-4o, GPT-4o Mini, o1 & more',          icon: Sparkles },
  { id: 'anthropic',  label: 'Anthropic',      description: 'Claude 3.5 Sonnet, Opus & more',          icon: Cpu      },
  { id: 'gemini',     label: 'Google Gemini',  description: 'Gemini 1.5, 2.0 Flash & more',            icon: Globe    },
  { id: 'openrouter', label: 'OpenRouter',     description: 'Access 100+ models via single API',          icon: Monitor  },
  { id: 'ollama',     label: 'Ollama',         description: 'Run open-source models locally',             icon: Settings },
  { id: 'custom',     label: 'Custom / BYOLLM', description: 'Any OpenAI-compatible endpoint',           icon: Settings },
];

export function ProviderSelector() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;

  return (
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
                model: '',
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

      {/* BYOLLM fields — shown when not using Fidscript */}
      {aiBrain.provider !== 'fidscript' && (
        <div className="mt-3 space-y-3 bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
          <p className="text-xs font-bold text-yellow-400">Bring Your Own Provider</p>
          {aiBrain.provider === 'custom' ? (
            <>
              <div>
                <label className="block text-[10px] text-[#6e684a] mb-1">Provider Name</label>
                <input
                  value={aiBrain.providerName}
                  onChange={e => updateAIBrain({ providerName: e.target.value })}
                  placeholder="e.g. My Custom Model"
                  className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6e684a] mb-1">Base URL</label>
                <input
                  value={aiBrain.baseUrl}
                  onChange={e => updateAIBrain({ baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6e684a] mb-1">API Key</label>
                <input
                  type="password"
                  value={aiBrain.apiKey}
                  onChange={e => updateAIBrain({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] text-[#6e684a] mb-1">API Key</label>
              <input
                type="password"
                value={aiBrain.apiKey}
                onChange={e => updateAIBrain({ apiKey: e.target.value })}
                placeholder={`Your ${aiBrain.provider} API key`}
                className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
