import React from 'react';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Client, Instance, DailyUsage } from '../../services/api';
import StatCards from './StatCards';
import TokenCosts from './TokenCosts';
import QuickActions from './QuickActions';

interface DashboardHomeProps {
  client: Client;
  tokenBalance: number;
  instances: Instance[];
  dailyUsage: DailyUsage[];
  messagesToday: number;
}

export default function DashboardHome({
  client, tokenBalance, instances, dailyUsage, messagesToday
}: DashboardHomeProps) {
  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
      </div>
    );
  }
  const connectedInstances = instances.filter(i => i.status === 'connected').length;
  const totalTokens = (dailyUsage || []).reduce((sum, d) => sum + (d.tokens_used ?? 0), 0);

  const chartData = dailyUsage.length > 0 ? dailyUsage : [
    { date: 'Mon', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
    { date: 'Tue', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
    { date: 'Wed', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
    { date: 'Thu', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
    { date: 'Fri', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
    { date: 'Sat', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
    { date: 'Sun', messages_sent: 0, tokens_used: 0, messages_delivered: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1f1d0b] via-[#2a2609] to-[#1f1d0b] border border-yellow-500/20 p-6 rounded-3xl text-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-yellow-500/10 text-yellow-400 text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full border border-yellow-500/20">
            Client Workspace
          </span>
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Welcome, {client.name}</h1>
        <p className="text-xs text-stone-300 mt-1 max-w-xl">
          Manage your messaging containers, send bulk messages, and monitor your token usage.
        </p>
      </div>

      <StatCards
        tokenBalance={tokenBalance}
        connectedInstances={connectedInstances}
        instances={instances}
        msgCountToday={messagesToday}
        totalTokens={totalTokens}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#181711] border border-[#2d2813] rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#eab308]" />
                Message Volume
              </h3>
              <p className="text-[10px] text-[#6e684a] mt-0.5">Daily messages sent over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#6e684a]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#eab308] rounded-full" /> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> Delivered</span>
            </div>
          </div>
          <div className="h-[200px] min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2813" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6e684a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6e684a' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #2d2813', backgroundColor: '#181711', color: '#a8a99e' }}
                  formatter={(value) => [`${value ?? 0}`, '']}
                />
                <Area type="monotone" dataKey="messages_sent" stroke="#eab308" fill="#2d2813" strokeWidth={2} />
                <Area type="monotone" dataKey="messages_delivered" stroke="#22c55e" fill="#1a2e1a" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TokenCosts />
      </div>

      <QuickActions />
    </div>
  );
}
