/**
 * MetricsHistoryChart.tsx — line/area chart for metric trends.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useAnalyticsHistory, type MetricRow } from './useAnalytics';

interface MetricsHistoryChartProps {
  period?: string;
  metrics?: string[];
}

const METRIC_LABELS: Record<string, string> = {
  messages_received: 'Messages In',
  messages_sent: 'Messages Out',
  ai_replies_generated: 'AI Replies',
  conversations_created: 'New Conversations',
  conversations_resolved: 'Resolved',
  campaign_sent: 'Campaign Sent',
  campaign_delivered: 'Delivered',
  campaign_failed: 'Failed',
  ai_handoffs_requested: 'Human Handoffs',
  automation_flows_started: 'Flows Started',
  automation_flows_completed: 'Flows Completed',
  sla_breached: 'SLA Breached',
  integration_events_synced: 'Sync Events',
};

const METRIC_COLORS: Record<string, string> = {
  messages_received: '#eab308',
  messages_sent: '#22c55e',
  ai_replies_generated: '#3b82f6',
  conversations_created: '#a855f7',
  conversations_resolved: '#22c55e',
  campaign_sent: '#f59e0b',
  campaign_delivered: '#10b981',
  campaign_failed: '#ef4444',
  ai_handoffs_requested: '#f97316',
  automation_flows_started: '#6366f1',
  automation_flows_completed: '#22c55e',
  sla_breached: '#ef4444',
  integration_events_synced: '#06b6d4',
};

function transformData(rows: MetricRow[]) {
  // Group by period_start, then pivot metrics into columns
  const byDate: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const date = row.period_start.slice(0, 10);
    if (!byDate[date]) byDate[date] = {};
    byDate[date][row.metric_type] = (byDate[date][row.metric_type] ?? 0) + row.value;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, metrics]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...metrics,
    }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#6e684a] font-bold mb-1">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white">{METRIC_LABELS[entry.name] ?? entry.name}:</span>
          <span className="text-yellow-400 font-mono font-bold">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function MetricsHistoryChart({ period = 'day', metrics }: MetricsHistoryChartProps) {
  const { data, loading } = useAnalyticsHistory({ period, metric: metrics?.[0] });

  if (loading) {
    return (
      <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4 h-72 animate-pulse">
        <div className="h-4 w-32 bg-[#2d2813] rounded mb-4" />
        <div className="h-full bg-[#2d2813]/50 rounded" />
      </div>
    );
  }

  const chartData = transformData(data);
  const activeMetrics = metrics ?? Object.keys(METRIC_LABELS).filter(m => data.some(r => r.metric_type === m));

  if (chartData.length === 0) {
    return (
      <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-6 flex items-center justify-center h-72">
        <p className="text-[#3d3a1e] text-sm">No historical data for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {activeMetrics.map(m => (
              <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={METRIC_COLORS[m] ?? '#888'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={METRIC_COLORS[m] ?? '#888'} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d2813" />
          <XAxis dataKey="date" tick={{ fill: '#6e684a', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#6e684a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 10, color: '#6e684a', paddingTop: 8 }}
            formatter={(value: string) => METRIC_LABELS[value] ?? value}
          />
          {activeMetrics.map(m => (
            <Area
              key={m}
              type="monotone"
              dataKey={m}
              stroke={METRIC_COLORS[m] ?? '#888'}
              fill={`url(#grad-${m})`}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
