/**
 * AnalyticsStats — 6 KPI cards with sparklines.
 */
import React from 'react';
import {
  MessageSquare,
  Users,
  Bot,
  Clock,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-green-400 text-xs font-semibold">
      <ArrowUpRight className="w-3 h-3" />+{value}%
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold">
      <ArrowDownRight className="w-3 h-3" />{value}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[#6e684a] text-xs font-semibold">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 40" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function KPICard({
  icon,
  label,
  value,
  unit,
  trend,
  trendLabel,
  sparklineData,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  color: string;
}) {
  return (
    <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <p className="text-xs text-[#6e684a]">{label}</p>
        </div>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white font-mono leading-none">
          {value}{unit && <span className="text-sm text-[#6e684a] font-normal ml-1">{unit}</span>}
        </p>
      </div>
      {trendLabel && <p className="text-[10px] text-[#5a554a]">{trendLabel}</p>}
      {sparklineData && <MiniSparkline data={sparklineData} color="#eab308" />}
    </div>
  );
}

export function AnalyticsStats() {
  const kpis = {
    totalConversations: 348,
    uniqueContacts: 187,
    aiResponseRate: 84,
    avgResponseTime: 1.8,
    handoffRate: 9,
    tokenUsage: 142000,
  };
  const kpiTrends = {
    totalConversations: 12,
    uniqueContacts: 8,
    aiResponseRate: 3,
    avgResponseTime: -15,
    handoffRate: 2,
    tokenUsage: 21,
  };
  const sparkConversations = [42, 58, 37, 73, 91, 28, 19];
  const sparkMessages = [187, 241, 163, 318, 402, 114, 87];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <KPICard
        icon={<MessageSquare className="w-4 h-4 text-yellow-400" />}
        label="Total Conversations"
        value={kpis.totalConversations.toLocaleString()}
        trend={kpiTrends.totalConversations}
        trendLabel="vs previous 7 days"
        sparklineData={sparkConversations}
        color="text-yellow-400"
      />
      <KPICard
        icon={<Users className="w-4 h-4 text-blue-400" />}
        label="Unique Contacts"
        value={kpis.uniqueContacts.toLocaleString()}
        trend={kpiTrends.uniqueContacts}
        trendLabel="vs previous 7 days"
        sparklineData={[12, 19, 14, 28, 31, 22, 27]}
        color="text-blue-400"
      />
      <KPICard
        icon={<Bot className="w-4 h-4 text-green-400" />}
        label="AI Response Rate"
        value={kpis.aiResponseRate}
        unit="%"
        trend={kpiTrends.aiResponseRate}
        sparklineData={[76, 80, 82, 79, 84, 83, 84]}
        color="text-green-400"
      />
      <KPICard
        icon={<Clock className="w-4 h-4 text-purple-400" />}
        label="Avg Response Time"
        value={kpis.avgResponseTime}
        unit="s"
        trend={kpiTrends.avgResponseTime}
        trendLabel="lower is better"
        sparklineData={[2.4, 2.1, 2.3, 1.9, 1.7, 1.8, 1.8].reverse()}
        color="text-purple-400"
      />
      <KPICard
        icon={<Activity className="w-4 h-4 text-red-400" />}
        label="Human Handoff Rate"
        value={kpis.handoffRate}
        unit="%"
        trend={kpiTrends.handoffRate}
        sparklineData={[8, 11, 10, 9, 7, 8, 9]}
        color="text-red-400"
      />
      <KPICard
        icon={<Zap className="w-4 h-4 text-orange-400" />}
        label="Token Usage"
        value={(kpis.tokenUsage / 1000).toFixed(0)}
        unit="K"
        trend={kpiTrends.tokenUsage}
        sparklineData={[89, 104, 112, 98, 121, 135, 142]}
        color="text-orange-400"
      />
    </div>
  );
}
