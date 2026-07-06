import React from 'react';
import { Zap } from 'lucide-react';
import { QuickActionsGrid } from './QuickActionsGrid';

export default function QuickActions() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap size={14} className="text-[#eab308]" />
            Quick Actions
          </h3>
          <p className="text-[10px] text-[#6e684a] mt-0.5">Jump to any section</p>
        </div>
      </div>
      <QuickActionsGrid />
    </div>
  );
}
