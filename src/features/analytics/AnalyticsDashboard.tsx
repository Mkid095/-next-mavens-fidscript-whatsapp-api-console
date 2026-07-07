/**
 * AnalyticsDashboard.tsx — full workspace analytics dashboard.
 *
 * Shows today's overview KPIs, a trend chart, and breakdowns by category.
 * Consumes platformApi.analyticsOverview() and platformApi.analyticsQuery().
 */
import { useState } from 'react';
import {
  MessageSquare, Bot, Send, Users, Zap, AlertTriangle,
  TrendingUp, CheckCircle, RefreshCw,
} from 'lucide-react';
import MetricCard from './MetricCard.js';
import MetricsHistoryChart from './MetricsHistoryChart.js';
import { useAnalyticsOverview } from './useAnalytics.js';
import { Loader2 } from 'lucide-react';

const OVERVIEW_METRICS = [
  { key: 'messages_received', label: 'Messages In', icon: <MessageSquare size={14} />, accent: 'blue' as const },
  { key: 'messages_sent', label: 'Messages Out', icon: <Send size={14} />, accent: 'green' as const },
  { key: 'ai_replies_generated', label: 'AI Replies', icon: <Bot size={14} />, accent: 'yellow' as const },
  { key: 'conversations_created', label: 'New Conversations', icon: <TrendingUp size={14} />, accent: 'purple' as const },
  { key: 'ai_handoffs_requested', label: 'Human Handoffs', icon: <AlertTriangle size={14} />, accent: 'red' as const },
  { key: 'sla_breached', label: 'SLA Breached', icon: <AlertTriangle size={14} />, accent: 'red' as const },
];

export default function AnalyticsDashboard() {
  const { data: overview, loading, refresh } = useAnalyticsOverview();
  const [period, setPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Analytics</h2>
          <p className="text-xs text-[#6e684a]">Workspace metrics and trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as typeof period)}
            className="px-3 py-1.5 bg-[#181711] border border-[#2d2813] rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          <button
            onClick={() => void refresh()}
            className="p-1.5 text-[#6e684a] hover:text-white rounded-lg border border-[#2d2813] hover:border-yellow-500/30"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {OVERVIEW_METRICS.map(m => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={overview[m.key] ?? 0}
            icon={m.icon}
            accent={m.accent}
            loading={loading}
          />
        ))}
        {/* Campaigns */}
        <MetricCard
          label="Campaigns Sent"
          value={(overview['campaign_sent'] ?? 0)}
          icon={<Send size={14} />}
          accent="yellow"
          loading={loading}
        />
        {/* Resolved */}
        <MetricCard
          label="Resolved"
          value={(overview['conversations_resolved'] ?? 0)}
          icon={<CheckCircle size={14} />}
          accent="green"
          loading={loading}
        />
      </div>

      {/* Token cost summary */}
      <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#6e684a] uppercase mb-3">Token Economy</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-[#6e684a] mb-1">AI Replies Cost</p>
            <p className="text-lg font-black text-yellow-400 font-mono">
              {(overview['ai_replies_generated'] ?? 0) * 10} tokens
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#6e684a] mb-1">Tool Calls</p>
            <p className="text-lg font-black text-blue-400 font-mono">
              {(overview['automation_flows_started'] ?? 0)} calls
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#6e684a] mb-1">Human Handoffs</p>
            <p className="text-lg font-black text-orange-400 font-mono">
              {(overview['ai_handoffs_requested'] ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#6e684a] mb-1">SLA Compliance</p>
            <p className="text-lg font-black text-green-400 font-mono">
              {overview['sla_breached']
                ? `${Math.round((1 - (overview['sla_breached'] as number) / Math.max(overview['conversations_created'] as number, 1)) * 100)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#6e684a] uppercase">Message Trends</p>
        </div>
        <MetricsHistoryChart period={period} metrics={['messages_received', 'messages_sent', 'ai_replies_generated']} />
      </div>

      {/* AI Performance chart */}
      <div>
        <p className="text-xs font-bold text-[#6e684a] uppercase mb-3">AI & Automation</p>
        <MetricsHistoryChart period={period} metrics={['ai_replies_generated', 'ai_handoffs_requested', 'automation_flows_started', 'automation_flows_completed']} />
      </div>

      {/* Campaign performance */}
      <div>
        <p className="text-xs font-bold text-[#6e684a] uppercase mb-3">Campaigns</p>
        <MetricsHistoryChart period={period} metrics={['campaign_sent', 'campaign_delivered', 'campaign_failed']} />
      </div>
    </div>
  );
}
