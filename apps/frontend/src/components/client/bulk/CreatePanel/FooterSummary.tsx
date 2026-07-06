import React from 'react';
import { SendHorizontal, Zap } from 'lucide-react';
import type { Instance } from '../../../services/api';

interface FooterSummaryProps {
  recipientCount: number;
  totalCost: number;
  messageText: string;
  selectedInstance: string;
  instances: Instance[];
  campaignName: string;
  creating: boolean;
  scheduledAt: string;
  onCreate: () => void;
}

export default function FooterSummary({
  recipientCount, totalCost, messageText,
  selectedInstance, instances,
  campaignName, creating, scheduledAt, onCreate,
}: FooterSummaryProps) {
  const inst = instances.find(i => i.name === selectedInstance);
  const statusColor = inst?.status === 'connected' ? 'bg-green-500' : inst?.status === 'connecting' ? 'bg-yellow-500' : 'bg-[#6e684a]';
  const segments = messageText.length > 1600 ? 3 : messageText.length > 400 ? 2 : 1;

  return (
    <div className="sticky bottom-0 bg-[#1a1915] border-t border-[#2d2813] -mx-3 px-3 py-2.5 flex items-center gap-2">
      <div className="flex-1 text-[10px] text-[#6e684a]">
        <p><span className="font-bold text-[#eab308]">{recipientCount}</span> recipient{recipientCount === 1 ? '' : 's'}</p>
        <p>
          <span className="font-bold text-[#eab308]">{totalCost}</span> token{totalCost === 1 ? '' : 's'}
          {recipientCount > 0 && <span className="text-[#5a554a]"> (~{segments}×{recipientCount})</span>}
        </p>
      </div>

      {selectedInstance && (
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
          <span className="text-[#6e684a]">{inst?.display_name || selectedInstance}</span>
        </div>
      )}

      <button
        onClick={onCreate}
        disabled={!campaignName.trim() || !selectedInstance || recipientCount === 0 || !messageText.trim() || creating}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#eab308] text-[#181711] text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-[#eab308]/90 transition-all"
      >
        <SendHorizontal className="w-3.5 h-3.5" />
        {creating ? 'Sending…' : scheduledAt ? 'Schedule' : <><Zap className="w-3.5 h-3.5" /> Send Now</>}
      </button>
    </div>
  );
}
