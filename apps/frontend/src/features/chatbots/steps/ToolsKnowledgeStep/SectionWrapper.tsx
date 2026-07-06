import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function SectionWrapper({
  icon: Icon, title, description, count, children, defaultOpen = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string; description: string; count?: number;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#1a1915]/50 transition text-left"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 shrink-0">
          <Icon size={16} className="text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{title}</p>
            {typeof count === 'number' && count > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full text-[9px] font-bold">{count}</span>
            )}
          </div>
          <p className="text-[10px] text-[#6e684a]">{description}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-[#6e684a] shrink-0" /> : <ChevronDown size={16} className="text-[#6e684a] shrink-0" />}
      </button>
      {open && <div className="border-t border-[#2d2813] p-4 space-y-3">{children}</div>}
    </div>
  );
}
