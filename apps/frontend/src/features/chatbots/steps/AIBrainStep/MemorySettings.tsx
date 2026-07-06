import React from 'react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';

export default function MemorySettings() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;

  return (
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
  );
}
