import React from 'react';
import { CreditCard, MessageSquare, Send, Activity } from 'lucide-react';
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
  const safeBalance = typeof tokenBalance === 'number' ? tokenBalance : 0;
  const safeTokens = typeof totalTokens === 'number' ? totalTokens : 0;
  const safeToday = typeof msgCountToday === 'number' ? msgCountToday : 0;
  const safeConnected = typeof connectedInstances === 'number' ? connectedInstances : 0;
  const safeInstances = Array.isArray(instances) ? instances.length : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Token Balance</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{safeBalance.toLocaleString()}</p>
        <p className="text-[10px] text-stone-400 mt-1">1 token = 1 text message</p>
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Containers</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{safeConnected}/{safeInstances}</p>
        <p className="text-[10px] text-stone-400 mt-1">Connected instances</p>
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Messages Today</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{safeToday.toLocaleString()}</p>
        <p className="text-[10px] text-stone-400 mt-1">Rate: 30/min max</p>
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-[10px] text-stone-500 font-bold uppercase">Tokens Used</p>
        </div>
        <p className="text-xl font-black text-forest-deep font-mono">{safeTokens.toLocaleString()}</p>
        <p className="text-[10px] text-stone-400 mt-1">Last 7 days</p>
      </div>
    </div>
  );
}