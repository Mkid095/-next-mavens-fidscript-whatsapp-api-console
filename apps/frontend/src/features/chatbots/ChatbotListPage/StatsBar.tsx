import React from 'react';
import { BarChart3, Zap, MessageSquare } from 'lucide-react';

interface StatsBarProps {
  bots: { trigger_count?: number; contact_count?: number; enabled: number }[];
  activeBots: number;
}

export default function StatsBar({ bots, activeBots }: StatsBarProps) {
  const totalContacts = bots.reduce((sum, b) => sum + (b.contact_count ?? 0), 0);
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-4">
        <p className="text-xs text-[#6e684a] flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Total</p>
        <p className="text-2xl font-bold text-white mt-1">{bots.length}</p>
      </div>
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-4">
        <p className="text-xs text-[#6e684a] flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-green-400" /> Active</p>
        <p className="text-2xl font-bold text-green-400 mt-1">{activeBots}</p>
      </div>
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-4">
        <p className="text-xs text-[#6e684a] flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Assigned Contacts</p>
        <p className="text-2xl font-bold text-white mt-1">{totalContacts.toLocaleString()}</p>
      </div>
    </div>
  );
}
