import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Instance } from '../../services/api';

interface InstancePickerProps {
  selectedInstance: string;
  connectedInstances: Instance[];
  showInstancePicker: boolean;
  onToggle: () => void;
  onSelect: (name: string) => void;
}

export default function InstancePicker({ selectedInstance, connectedInstances, showInstancePicker, onToggle, onSelect }: InstancePickerProps) {
  return (
    <div className="relative">
      <button onClick={onToggle} className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-forest-deep transition-all">
        <SmartphoneIcon className="w-3 h-3" />
        {selectedInstance || 'All containers'}
        <ChevronDown className="w-3 h-3" />
      </button>
      {showInstancePicker && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 min-w-[180px]">
          <button onClick={() => onSelect('')} className="w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 border-b border-[#eaebe4] font-bold text-forest-deep">All containers</button>
          {connectedInstances.map(inst => (
            <button key={inst.name} onClick={() => onSelect(inst.name)} className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedInstance === inst.name ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-green-500' : 'bg-stone-300'}`} />
              {inst.display_name || inst.name}
              {inst.phone_number && <span className="text-stone-400 font-mono ml-auto">{inst.phone_number}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}
