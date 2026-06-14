import React from 'react';
import { CreditCard, MessageSquare, Send, Zap } from 'lucide-react';
import type { Instance } from '../../services/api';

interface StatCardsProps {
  tokenBalance: number;
  connectedInstances: number;
  instances: Instance[];
  msgCountToday: number;
  totalTokens: number;
}

export default function StatCards({
  tokenBalance,
  connectedInstances,
  instances,
  msgCountToday,
  totalTokens,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Token Balance</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{tokenBalance.toLocaleString()}</p>
        <p className="text-[10px] text-stone-400 mt-1">1 token = 1 text message</p>
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Containers</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{connectedInstances}/{instances.length}</p>
        <p className="text-[10px] text-stone-400 mt-1">Connected instances</p>
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Messages Today</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{msgCountToday || 0}</p>
        <p className="text-[10px] text-stone-400 mt-1">Rate: 30/min max</p>
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Tokens Used</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{totalTokens.toLocaleString()}</p>
        <p className="text-[10px] text-stone-400 mt-1">Last 7 days</p>
      </div>
    </div>
  );
}
