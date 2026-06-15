import React from 'react';
import {
  BarChart3, Clock,
  CheckCircle, XCircle, MessageSquare
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Client, Instance, DailyUsage, ClientMessage } from '../../services/api';
import StatCards from './StatCards';
import TokenCosts from './TokenCosts';

interface DashboardHomeProps {
  client: Client;
  tokenBalance: number;
  instances: Instance[];
  dailyUsage: DailyUsage[];
  recentMessages: ClientMessage[];
  messagesToday: number;
}

export default function DashboardHome({
  client, tokenBalance, instances, dailyUsage, recentMessages, messagesToday
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
          Manage your WhatsApp containers, send bulk messages, and monitor your token usage.
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
        <div className="lg:col-span-2 bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-yellow-700" />
                Message Volume
              </h3>
              <p className="text-[10px] text-stone-500 mt-0.5">Daily messages sent over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full" /> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> Delivered</span>
            </div>
          </div>
          <div className="h-[200px] min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaebe4" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6a6c5d' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6a6c5d' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eaebe4' }}
                  formatter={(value) => [`${value ?? 0}`, '']}
                />
                <Area type="monotone" dataKey="messages_sent" stroke="#eab308" fill="#fef9c3" strokeWidth={2} />
                <Area type="monotone" dataKey="messages_delivered" stroke="#22c55e" fill="#dcfce7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TokenCosts />
      </div>

      <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-yellow-700" />
            Recent Messages
          </h3>
          <span className="text-[10px] text-stone-400">Last 10 messages</span>
        </div>
        {recentMessages.length > 0 ? (
          <div className="space-y-2">
            {recentMessages.slice(0, 10).map((msg) => (
              <div key={msg.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {msg.direction === 'outgoing' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                   msg.is_read === 0 ? <Clock className="w-4 h-4 text-amber-500" /> :
                   <XCircle className="w-4 h-4 text-red-500" />}
                  <div>
                    <p className="text-xs font-bold text-forest-deep font-mono">{msg.from_number}</p>
                    <p className="text-[10px] text-stone-500 truncate max-w-[200px]">{msg.content}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  msg.direction === 'outgoing' ? 'bg-green-100 text-green-800' :
                  msg.is_read === 0 ? 'bg-amber-100 text-amber-800' :
                  'bg-stone-100 text-stone-600'
                }`}>{msg.direction === 'outgoing' ? 'Sent' : msg.is_read === 0 ? 'New' : 'Received'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-stone-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="text-xs font-semibold">No messages yet</p>
            <p className="text-[10px]">Start by creating a WhatsApp container and sending your first message.</p>
          </div>
        )}
      </div>
    </div>
  );
}
