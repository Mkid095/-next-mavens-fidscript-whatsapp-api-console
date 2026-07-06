import React from 'react';
import { ShieldOff, Zap, ChevronUp, ChevronDown } from 'lucide-react';

export type ResumePolicy = 'manual' | 'next_message' | 'timeout';

interface AiControlBarProps {
  aiOverride: 'ai' | 'manual' | null;
  hasChatbot: boolean;
  isGroup: boolean;
  overrideLoading: boolean;
  showTakeoverMenu: boolean;
  onTakeOver: (policy: ResumePolicy) => void;
  onResumeAi: () => void;
  onToggleMenu: () => void;
}

export function AiControlBar({
  aiOverride, hasChatbot, isGroup, overrideLoading, showTakeoverMenu,
  onTakeOver, onResumeAi, onToggleMenu,
}: AiControlBarProps) {
  if (aiOverride === 'manual') {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-[#3d3823] bg-[#1a1915] px-4 py-1.5">
        <ShieldOff size={12} className="text-[#eab308]" />
        <span className="text-[11px] font-medium text-[#a8a99e]">AI paused — you are replying manually</span>
        <button onClick={onResumeAi} disabled={overrideLoading}
          className="ml-2 text-[11px] font-semibold text-[#eab308] underline hover:text-[#fde047] disabled:opacity-50">
          Resume AI
        </button>
      </div>
    );
  }

  if (hasChatbot && !isGroup) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#2d2813]">
        <div className="relative">
          <button onClick={onToggleMenu} disabled={overrideLoading}
            className="flex items-center gap-1 rounded-lg border border-[#3d3823] bg-[#1a1915] px-2 py-1 text-[11px] font-medium text-[#8f834a] transition hover:border-[#eab308]/40 hover:text-[#eab308] disabled:opacity-50">
            <ShieldOff size={12} className="text-[#eab308]" />
            {overrideLoading ? '…' : 'Take Over'}
            {showTakeoverMenu ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showTakeoverMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-[#2d2813] bg-[#1a1915] py-1 shadow-lg" data-takeover-menu>
              {[['manual','Until I resume'],['next_message','Resume after my reply'],['timeout','30 minutes']].map(([policy, label]) => (
                <button key={policy} onClick={() => onTakeOver(policy as ResumePolicy)}
                  className="flex w-full items-center px-3 py-2 text-left text-[11px] text-[#a8a99e] hover:bg-[#2d2813] hover:text-white">
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
