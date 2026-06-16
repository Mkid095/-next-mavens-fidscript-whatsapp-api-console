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
import KenyanNodesMap from './KenyanNodesMap';
import { mapNodes } from './dashboardData';

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

  // Real aggregates
  const totalMessages = clients.reduce((sum, c) => sum + c.total_messages, 0);
  const messagesToday = clients.reduce((sum, c) => sum + c.msg_count_today, 0);
  const connectedInstances = instances.filter((i) => i.status === 'connected').length;
  const totalClients = clients.length;

  return (
    <div className="space-y-6">
      <QuickAlertBar activeClusters={activeClusters} userEmail={userEmail} onNavigate={onNavigate} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Messages Sent Today"
          value={`${messagesToday.toLocaleString()}`}
          trend="across all clients"
          trendValue=""
          icon={<Mail size={18} />}
          iconBgClass="bg-[#102e24]"
          iconColor="text-emerald-400"
          cardBgClass="bg-[#0b1b16]"
          cardBorderClass="border-[#18392f]"
          valueColor="text-white"
          chartData={[35, 45, 60, 50, 75, 40, 65, 80, 50, 68, 85, 95]}
          chartBarClass="bg-[#0c3124]"
        />
        <StatCard
          label="Total Messages Sent"
          value={totalMessages.toLocaleString()}
          trend="all time across platform"
          trendValue=""
          icon={<CheckCircle2 size={18} />}
          iconBgClass="bg-emerald-100"
          iconColor="text-emerald-800"
          cardBgClass="bg-white"
          valueColor="text-forest-deep"
          chartData={[95, 94, 98, 99, 99.9, 99.98, 99.95, 99.8, 99.9, 99.98, 99.95, 99.99]}
          chartBarClass="bg-stone-100"
        />
        <StatCard
          label="Active Containers"
          value={`${connectedInstances} / ${instances.length}`}
          trend="containers connected"
          trendValue={connectingCount > 0 ? `${connectingCount} connecting` : ''}
          icon={<Smartphone size={18} />}
          iconBgClass="bg-[#10231d]/5"
          iconColor="text-[#10231d]"
          cardBgClass="bg-white"
          valueColor="text-forest-deep"
          chartData={[20, 35, 45, 30, 60, 55, 68, 72, 85, 90, 80, 95]}
          chartBarClass="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ActiveInstancesChart dailyTrends={analytics?.daily_trends} />
        <BillingYieldCard analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TopClientsTable clients={clients} />
        <KenyanNodesMap nodes={mapNodes} />
      </div>

      <RecentLogs logs={logs} onNavigate={onNavigate} connectingCount={connectingCount} />
    </div>
  );
}
