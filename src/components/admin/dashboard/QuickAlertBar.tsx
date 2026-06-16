import React from 'react';
import { Signal } from 'lucide-react';

interface QuickAlertBarProps {
  activeClusters: number;
  userEmail?: string;
  onNavigate: (tab: string) => void;
}

export default function QuickAlertBar({ activeClusters, userEmail, onNavigate }: QuickAlertBarProps) {
  return (
    <div className="bg-[#272c30] border border-[#3d3a1e] text-stone-300 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
      <div className="flex items-center gap-2">
        <span className="p-1 bg-[#3d3a1e] text-[#eab308] rounded-lg">
          <Signal className="w-3.5 h-3.5" />
        </span>
        <span>
          FIDScript admin terminal —{' '}
          <code className="font-mono text-stone-100 bg-[#181711] px-1.5 py-0.5 rounded text-[10px]">{userEmail}</code>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold text-yellow-500">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          {activeClusters} Containers Online
        </span>
        <span className="text-stone-600">|</span>
        <button onClick={() => onNavigate('audit-logs')} className="underline hover:text-white transition-colors">
          Review audit trail
        </button>
      </div>
    </div>
  );
}
