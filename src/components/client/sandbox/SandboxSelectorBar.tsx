import { Zap, Key } from 'lucide-react';
import type { Instance } from '../../../services/api';
import type { SandboxApiKey } from './types.js';

export interface SandboxSelectorBarProps {
  instances: Instance[];
  instanceName: string;
  onInstanceName: (v: string) => void;
  apiKeys: SandboxApiKey[];
  selectedKeyId: string;
  onSelectedKeyId: (v: string) => void;
  tokenBalance: number;
}

export default function SandboxSelectorBar({
  instances,
  instanceName,
  onInstanceName,
  apiKeys,
  selectedKeyId,
  onSelectedKeyId,
  tokenBalance,
}: SandboxSelectorBarProps) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-[#cbd3cf]">
        <Zap className="w-4 h-4 text-yellow-600" />
        <span>API Sandbox</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[#6e684a]">
        <span>Container:</span>
        <select
          value={instanceName}
          onChange={e => onInstanceName(e.target.value)}
          className="px-2 py-1 border border-[#2d2813] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500 bg-[#181711] text-[#a8a99e]"
        >
          <option value="">-- Select --</option>
          {instances.map(inst => (
            <option key={inst.id} value={inst.name}>{inst.name} ({inst.status})</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[#6e684a]">
        <Key className="w-3.5 h-3.5 text-[#5a554a]" />
        <span>API Key:</span>
        <select
          value={selectedKeyId}
          onChange={e => onSelectedKeyId(e.target.value)}
          className="px-2 py-1 border border-[#2d2813] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500 min-w-[140px] bg-[#181711] text-[#a8a99e]"
        >
          <option value="">-- Select --</option>
          {apiKeys.map(k => (
            <option key={k.id} value={k.id}>{k.name} ({k.key_prefix || 'fidscript_live_…'})</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[#6e684a] ml-auto">
        <span>Balance:</span>
        <span className="font-bold text-yellow-500">{tokenBalance.toLocaleString()} tokens</span>
      </div>
    </div>
  );
}
