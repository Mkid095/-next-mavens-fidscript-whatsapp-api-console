import React from 'react';
import type { Instance } from '../../services/api';
import InstancePicker from './InstancePicker';

interface SendingFromBarProps {
  selectedInstance: string;
  connectedInstances: Instance[];
  showInstancePicker: boolean;
  onToggle: () => void;
  onSelect: (name: string) => void;
}

export default function SendingFromBar({ selectedInstance, connectedInstances, showInstancePicker, onToggle, onSelect }: SendingFromBarProps) {
  return (
    <div className="px-4 py-2 border-b border-[#eaebe4] bg-white flex items-center gap-2 shrink-0">
      <span className="text-[10px] text-stone-400 font-medium">Sending from:</span>
      <InstancePicker selectedInstance={selectedInstance} connectedInstances={connectedInstances} showInstancePicker={showInstancePicker} onToggle={onToggle} onSelect={onSelect} />
      {connectedInstances.length === 0 && <span className="text-[10px] text-red-500">Connect a container to send messages</span>}
    </div>
  );
}
