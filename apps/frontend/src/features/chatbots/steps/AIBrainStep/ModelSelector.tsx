import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { ProviderModel } from './types';

interface Props {
  models: ProviderModel[];
  loadingModels: boolean;
  isUsingShared: boolean;
  selectedConnection: { id: string } | undefined;
  onModelChange: (model: string, contextLength?: number) => void;
}

export default function ModelSelector({ models, loadingModels, isUsingShared, selectedConnection, onModelChange }: Props) {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;

  return (
    <div>
      <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">Model</label>

      {/* Empty state */}
      {!isUsingShared && !selectedConnection && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-2">
          <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300">Select a provider or connection above to choose a model.</p>
        </div>
      )}

      {/* Model pills from registry */}
      {isUsingShared && (
        <div className="mb-2">
          {loadingModels ? (
            <div className="flex items-center gap-2 text-[#6e684a] text-xs">
              <Loader2 size={12} className="animate-spin" /> Loading models...
            </div>
          ) : models.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {models.map(m => (
                <button key={m.id} onClick={() => onModelChange(m.model_id, m.context_length)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition ${
                    aiBrain.model === m.model_id ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-[#1a1915] text-[#6e684a] border border-[#2d2813] hover:border-[#3d3823]'
                  }`}
                  title={`${m.context_length.toLocaleString()} tokens context`}>
                  {m.model_id}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-[#6e684a] mb-2">No models configured for this provider. Enter manually below.</p>
          )}
        </div>
      )}

      {/* Manual model input */}
      <input type="text" value={aiBrain.model} onChange={e => updateAIBrain({ model: e.target.value })}
        placeholder="e.g. gemini-2.0-flash, gpt-4o-mini"
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-2.5 text-white text-sm font-mono placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none" />
    </div>
  );
}
