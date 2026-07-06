import React from 'react';
import { Smartphone, MessageSquare, Cpu, BookOpen, Sparkles } from 'lucide-react';

interface ConfigItems {
  icon: React.ElementType;
  label: string;
  value: string;
  ok: boolean;
}

interface ConfigSummaryProps {
  configItems: ConfigItems[];
}

export default function ConfigSummary({ configItems }: ConfigSummaryProps) {
  return (
    <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
      <p className="text-[10px] font-bold text-[#8f834a] uppercase tracking-wider mb-3">Configuration</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {configItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${item.ok ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-stone-500/10 border border-stone-500/20'}`}>
                <Icon size={14} className={item.ok ? 'text-emerald-400' : 'text-stone-500'} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#6e684a]">{item.label}</p>
                <p className={`text-xs font-semibold capitalize truncate ${item.ok ? 'text-white' : 'text-stone-500'}`}>{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
