import React from 'react';
import { Inbox, MessageSquare, Send, Zap } from 'lucide-react';

const TOKEN_COSTS = [
  { action: 'Send Text Message', cost: 1, icon: MessageSquare },
  { action: 'Send Image', cost: 2, icon: MessageSquare },
  { action: 'Send Document', cost: 3, icon: MessageSquare },
  { action: 'Send Audio', cost: 4, icon: MessageSquare },
  { action: 'Bulk Campaign', cost: 1, icon: Send },
  { action: 'OTP Message', cost: 1, icon: Zap },
];

export default function TokenCosts() {
  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5">
          <Inbox className="w-4 h-4 text-yellow-700" />
          Token Costs
        </h3>
      </div>
      <div className="space-y-2">
        {TOKEN_COSTS.map((item) => (
          <div key={item.action} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
            <div className="flex items-center gap-2">
              <item.icon className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] font-semibold text-stone-700">{item.action}</span>
            </div>
            <span className="text-[11px] font-bold text-yellow-700 font-mono">{item.cost} token{item.cost > 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
