import React from 'react';
import type { AnalyticsData } from '../../services/api';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
}

export default function AnalyticsView({ analytics }: AnalyticsViewProps) {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
        <p className="text-xs text-[#60737a] font-semibold">Total Clients</p>
        <p className="text-2xl font-bold text-[#272c30]">{analytics.total_clients}</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
        <p className="text-xs text-[#60737a] font-semibold">Active Instances</p>
        <p className="text-2xl font-bold text-[#272c30]">{analytics.connected_instances}</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
        <p className="text-xs text-[#60737a] font-semibold">Messages Today</p>
        <p className="text-2xl font-bold text-[#272c30]">{analytics.messages_today.toLocaleString()}</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
        <p className="text-xs text-[#60737a] font-semibold">Delivery Rate</p>
        <p className="text-2xl font-bold text-emerald-600">{analytics.delivery_rate}%</p>
      </div>
    </div>
  );
}
