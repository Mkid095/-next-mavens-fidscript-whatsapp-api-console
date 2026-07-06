import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardOverview from '../DashboardOverview';
import InstancesView from '../InstancesView';
import ClientsView from '../ClientsView';
import ApiConsoleView from '../ApiConsoleView';
import LogsAndAnalyticsView from '../LogsAndAnalyticsView';
import InboxView from '../InboxView';
import SecurityKeysView from '../SecurityKeysView';
import LLMProvidersView from './providers/LLMProvidersView';
import ChatbotsAdminView from './chatbot/ChatbotsAdminView';
import AnalyticsView from './AnalyticsView';
import AuditLogView from './audit/AuditLogView';
import type { Instance, Client, ApiLog, AnalyticsData } from '../../services/api';

interface AdminContentProps {
  instances: Instance[];
  clients: Client[];
  logs: ApiLog[];
  analytics: AnalyticsData | null;
  messages: { id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[];
  keys: { id: string; name: string; key: string; created: string; lastUsed: string; status: string }[];
  handleAddInstance: (data: { name: string; display_name?: string; client_id?: string }) => Promise<void>;
  handleUpdateInstanceStatus: (name: string, status: string) => Promise<void>;
  handleDeleteInstance: (name: string) => Promise<void>;
  handleAddClient: (data: { name: string; email: string; phone?: string; plan_id?: string }) => Promise<void>;
  handleToggleClient: (id: string) => Promise<void>;
  handleResetClientKey: (id: string) => Promise<void>;
  handleDeleteClient: (id: string) => Promise<void>;
  handleAwardTokens: (id: string, newBalance: number) => Promise<void>;
  handleAddKey: (name: string) => void;
  handleRevokeKey: (id: string) => void;
  handleMarkMessageRead: (id: string) => void;
}

function mapLog(l: ApiLog) {
  return { id: l.id, timestamp: l.timestamp, level: (l.response_status === 200 ? 'SUCCESS' : 'WARNING') as 'SUCCESS' | 'WARNING', source: l.endpoint, message: `${l.method} ${l.endpoint}` };
}

export function AdminContent({
  instances,
  clients,
  logs,
  analytics,
  messages,
  keys,
  handleAddInstance,
  handleUpdateInstanceStatus,
  handleDeleteInstance,
  handleAddClient,
  handleToggleClient,
  handleResetClientKey,
  handleDeleteClient,
  handleAwardTokens,
  handleAddKey,
  handleRevokeKey,
  handleMarkMessageRead,
}: AdminContentProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const renderContent = () => {
    const path = location.pathname;

    if (path === '/admin' || path === '/admin/dashboard') {
      return (
        <DashboardOverview
          instances={instances} clients={clients} analytics={analytics} logs={logs.map(mapLog)}
          onNavigate={(tab) => navigate(`/admin/${tab.toLowerCase().replace(' ', '-')}`)}
        />
      );
    }
    if (path === '/admin/instances') {
      return (
        <InstancesView instances={instances} clients={clients}
          onAddInstance={handleAddInstance} onUpdateStatus={handleUpdateInstanceStatus} onDeleteInstance={handleDeleteInstance}
        />
      );
    }
    if (path === '/admin/clients') {
      return (
        <ClientsView clients={clients} onAddClient={handleAddClient} onToggleClient={handleToggleClient}
          onResetKey={handleResetClientKey} onDeleteClient={handleDeleteClient} onAwardTokens={handleAwardTokens}
        />
      );
    }
    if (path === '/admin/api-console') { return <ApiConsoleView />; }
    if (path === '/admin/logs') {
      return (
        <LogsAndAnalyticsView analytics={analytics}
          logs={logs.map((l) => ({ id: l.id, timestamp: l.timestamp, level: l.response_status === 200 ? 'SUCCESS' : 'WARNING', source: l.client_name || 'System', message: `${l.method} ${l.endpoint} - ${l.response_status || 'pending'}` }))}
          onAddLog={() => {}}
        />
      );
    }
    if (path === '/admin/audit-logs') { return <AuditLogView />; }
    if (path === '/admin/analytics') { return <AnalyticsView analytics={analytics} />; }
    if (path === '/admin/inbox') { return <InboxView messages={messages} onMarkRead={handleMarkMessageRead} />; }
    if (path === '/admin/keys') { return <SecurityKeysView keys={keys} onAddKey={handleAddKey} onRevokeKey={handleRevokeKey} />; }
    if (path === '/admin/providers') { return <LLMProvidersView />; }
    if (path === '/admin/chatbots') { return <ChatbotsAdminView />; }
    return (
      <DashboardOverview instances={instances} clients={clients} analytics={analytics} logs={logs.map(mapLog)}
        onNavigate={(tab) => navigate(`/admin/${tab.toLowerCase().replace(' ', '-')}`)}
      />
    );
  };

  return <>{renderContent()}</>;
}
