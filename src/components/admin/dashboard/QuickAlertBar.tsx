import React from 'react';
import { Signal } from 'lucide-react';

interface QuickAlertBarProps {
  activeClusters: number;
  userEmail?: string;
  onNavigate: (tab: string) => void;
}

export default function QuickAlertBar({ activeClusters, userEmail = 'kennedygithinjioffice@gmail.com', onNavigate }: QuickAlertBarProps) {
  return (
    <div className="bg-[#122b22] border border-[#1d4739] text-[#bbf7d0] px-4 py-3.5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm shadow-[#0a1813]">
      <div className="flex items-center gap-2">
        <span className="p-1 bg-[#1d4739] text-[#10b981] rounded-lg">
          <Signal className="w-3.5 h-3.5" />
        </span>
        <span>
          FIDScript Multi-instance terminal synchronized for administrator <strong>Kennedy</strong> under{' '}
          <code className="font-mono text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded">{userEmail}</code>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {activeClusters} Containers Online
        </span>
        <span className="text-[#89a296]">|</span>
        <button onClick={() => onNavigate('Audit Logs')} className="underline hover:text-white transition-colors">
          Review audit trail
        </button>
      </div>
    </div>
  );
}
