import React from 'react';
import { Database, Users, Smartphone } from 'lucide-react';
import type { AnalyticsData } from '../../../services/types';

interface BillingYieldCardProps {
  analytics?: AnalyticsData | null;
}

export default function BillingYieldCard({ analytics }: BillingYieldCardProps) {
  const revenue = analytics?.revenue_kes ?? 0;

  return (
    <div className="bg-[#181711] border border-[#3d3a1e] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
      <div className="space-y-4">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Platform Summary</p>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-none">
            {revenue > 0 ? `${(revenue / 1000).toFixed(0)}K tokens` : '—'}
          </h2>
          <p className="text-[10px] text-stone-400">Token purchases + awards · 30d</p>
        </div>

        <hr className="border-[#3d3a1e]" />

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#3d3a1e] flex items-center justify-center text-yellow-500">
                <Users size={13} />
              </span>
              <div>
                <p className="font-semibold text-stone-200 text-[11px]">Active Clients</p>
                <p className="text-[10px] text-stone-500">paying accounts</p>
              </div>
            </div>
            <span className="font-bold text-white">{analytics?.active_clients ?? 0}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#3d3a1e] flex items-center justify-center text-yellow-500">
                <Smartphone size={13} />
              </span>
              <div>
                <p className="font-semibold text-stone-200 text-[11px]">Connected Containers</p>
                <p className="text-[10px] text-stone-500">live sessions</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-white">{analytics?.connected_instances ?? 0}</span>
              <span className="text-stone-500 text-[10px]"> / {analytics?.total_instances ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
