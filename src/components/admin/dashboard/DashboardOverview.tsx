import React from 'react';
import { Mail, CheckCircle2, Smartphone } from 'lucide-react';
import type { Instance } from '../../../services/api';
import type { Client } from '../../../services/api';
import type { SystemLog } from '../../../types';
import type { AnalyticsData } from '../../../services/types';
import StatCard from './StatCard';
import ActiveInstancesChart from './ActiveInstancesChart';
import TopClientsTable from './TopClientsTable';
import RecentLogs from './RecentLogs';
import QuickAlertBar from './QuickAlertBar';
import BillingYieldCard from './BillingYieldCard';
import InstanceStatusCard from './InstanceStatusCard';
import TokenCostGuide from './TokenCostGuide';

interface DashboardOverviewProps {
  instances: Instance[];
  clients: Client[];
  analytics?: AnalyticsData | null;
  logs: SystemLog[];
  onNavigate: (tab: string) => void;
  userEmail?: string;
}

export default function DashboardOverview({
  instances,
  clients,
  analytics,
  logs,
  onNavigate,
  userEmail,
}: DashboardOverviewProps) {
  const activeClusters = instances.filter((i) => i.status === 'connected').length;
  const connectingCount = instances.filter((i) => i.status === 'connecting').length;

  const totalMessages = analytics?.messages_this_month ?? clients.reduce((sum, c) => sum + c.total_messages, 0);
  const messagesToday = analytics?.messages_today ?? clients.reduce((sum, c) => sum + c.msg_count_today, 0);
  const connectedInstances = instances.filter((i) => i.status === 'connected').length;

  // Derive sparkline data from real daily trends
  const messagesTrend = analytics?.daily_trends?.slice(-12).map(d => d.messages_sent) ?? [];
  const deliveryTrend = analytics?.daily_trends?.slice(-12).map(d =>
    d.messages_sent > 0 ? (d.messages_delivered / d.messages_sent) * 100 : 0
  ) ?? [];
  const volumeTrend = analytics?.daily_trends?.slice(-12).map(d => d.messages_sent + d.failed_messages) ?? [];

  return (
    <div className="space-y-6">
      <QuickAlertBar activeClusters={activeClusters} userEmail={userEmail} onNavigate={onNavigate} />

      {/* Stat cards - charcoal + yellow brand palette */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Messages Sent Today"
          value={messagesToday.toLocaleString()}
          trend="across all clients"
          trendValue=""
          icon={<Mail size={18} />}
          iconBgClass="bg-[#181711]"
          iconColor="text-yellow-500"
          cardBgClass="bg-[#181711]"
          cardBorderClass="border-[#3d3a1e]"
          valueColor="text-white"
          chartData={messagesTrend.length ? messagesTrend : [0]}
          chartBarClass="bg-[#3d3a1e]"
        />
        <StatCard
          label="Total Messages Sent"
          value={totalMessages.toLocaleString()}
          trend="all time across platform"
          trendValue=""
          icon={<CheckCircle2 size={18} />}
          chartData={deliveryTrend.length ? deliveryTrend : [0]}
        />
        <StatCard
          label="Active Containers"
          value={`${connectedInstances} / ${instances.length}`}
          trend="containers connected"
          trendValue={connectingCount > 0 ? `${connectingCount} connecting` : ''}
          icon={<Smartphone size={18} />}
          chartData={volumeTrend.length ? volumeTrend : [0]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ActiveInstancesChart dailyTrends={analytics?.daily_trends} />
        <BillingYieldCard analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TopClientsTable clients={clients} />
        <InstanceStatusCard instances={instances} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentLogs logs={logs} onNavigate={onNavigate} connectingCount={connectingCount} />
        <TokenCostGuide />
      </div>
    </div>
  );
}
