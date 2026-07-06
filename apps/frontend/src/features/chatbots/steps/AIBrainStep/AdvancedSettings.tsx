import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';

export default function AdvancedSettings() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;

  return (
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
  );
}
