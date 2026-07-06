import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { Instance } from '../../../../services/api';

interface InstanceCardStatsProps {
  inst: Instance;
}

export default function InstanceCardStats({ inst }: InstanceCardStatsProps) {
  return (
    <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6e684a]">
      {inst.message_count !== undefined && (
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {inst.message_count.toLocaleString()} msgs
        </span>
      )}
      {inst.last_active && (
        <span>
          Active {new Date(inst.last_active).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
