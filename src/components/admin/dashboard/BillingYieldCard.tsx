import React from 'react';
import { Database, CheckCircle, TrendingUp } from 'lucide-react';
import type { AnalyticsData } from '../../../services/types';

interface BillingYieldCardProps {
  analytics?: AnalyticsData | null;
}

export default function BillingYieldCard({ analytics }: BillingYieldCardProps) {
  const revenue = analytics?.revenue_kes ?? 0;

  return (
    <div className="bg-[#dcefe5] border border-[#bcdbc8] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
      <div className="space-y-4">
        <p className="text-[11px] font-bold text-[#1e583c] uppercase tracking-wider">Estimated Revenue (Tokens)</p>

        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[#0e3c25] tracking-tight leading-none">
            {revenue > 0 ? `${(revenue / 1000).toFixed(0)}K` : '—'}
          </h2>
          <div className="flex items-center gap-1 text-xs font-semibold text-[#185335]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Token purchases + awards (30d)</span>
          </div>
        </div>

        <hr className="border-[#bddfc9]" />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c8e2d4] flex items-center justify-center text-emerald-800">
                <Database className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="font-bold text-[#143625]">Active Clients</p>
                <p className="text-[10px] text-[#4d7d65]">{analytics?.active_clients ?? 0} paying accounts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-forest-deep">{analytics?.total_clients ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c8e2d4] flex items-center justify-center text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="font-bold text-[#143625]">Connected Containers</p>
                <p className="text-[10px] text-[#4d7d65]">{analytics?.connected_instances ?? 0} active sessions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-forest-deep">{analytics?.total_instances ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
