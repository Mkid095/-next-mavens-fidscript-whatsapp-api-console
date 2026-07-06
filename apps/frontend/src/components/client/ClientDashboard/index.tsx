import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Client, Instance, TokenPackage, DailyUsage, ClientMessage } from '../../services/api';
import Sidebar, { ClientSection } from '../../Sidebar';
import BottomNav from '../../shared/BottomNav';
import { UpdateToast } from '../../shared/UpdateToast';
import ClientContent from '../ClientContent';
import { useInstanceSSE, type InstanceStateChange } from '../whatsapp/useInstanceSSE';
import { CommandKProvider } from '../../../features/search/index.js';
import ChatbotBuilderShell from '../../../features/chatbots/ChatbotBuilderShell';
import { useDashboardStats } from './DashboardStats';
import { handleLogout } from './DashboardActions';

interface ClientDashboardProps {
  client: Client;
  clientToken?: string;
  instances: Instance[];
  onInstancesChange: (instances: Instance[]) => void;
  onLogout: () => void;
  tokenBalance: number;
  tokenPackages: TokenPackage[];
  dailyUsage: DailyUsage[];
  recentMessages: ClientMessage[];
  messagesToday: number;
  onTokenBalanceChange: (balance: number) => void;
}

const pathToSection = (path: string): ClientSection => {
  const map: Record<string, ClientSection> = {
    '/client': 'dashboard',
    '/client/dashboard': 'dashboard',
    '/client/whatsapp': 'whatsapp',
    '/client/api-keys': 'api-keys',
    '/client/docs': 'docs',
    '/client/sandbox': 'sandbox',
    '/client/messages': 'messages',
    '/client/campaigns': 'campaigns',
    '/client/contacts': 'contacts',
    '/client/token-store': 'token-store',
    '/client/chatbots': 'chatbots',
    '/client/settings': 'settings',
  };
  return map[path] || 'dashboard';
};

const sectionToPath = (section: ClientSection): string => {
  const map: Record<ClientSection, string> = {
    'dashboard': '/client',
    'whatsapp': '/client/whatsapp',
    'api-keys': '/client/api-keys',
    'docs': '/client/docs',
    'sandbox': '/client/sandbox',
    'messages': '/client/messages',
    'campaigns': '/client/campaigns',
    'contacts': '/client/contacts',
    'token-store': '/client/token-store',
    'chatbots': '/client/chatbots',
    'settings': '/client/settings',
  };
  return map[section];
};

export default function ClientDashboard({
  client,
  clientToken,
  instances,
  onInstancesChange,
  onLogout,
  tokenBalance,
  tokenPackages,
  dailyUsage,
  recentMessages,
  messagesToday,
  onTokenBalanceChange,
}: ClientDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeSection = pathToSection(location.pathname);

  useInstanceSSE(instances, (name: string, change: InstanceStateChange) => {
    onInstancesChange(
      instances.map(i =>
        i.name === name
          ? {
              ...i,
              status: change.state,
              phone_number: change.state === 'disconnected' ? null : (change.phoneNumber || i.phone_number),
            }
          : i,
      ),
    );
  });

  const handleSectionChange = useCallback((section: ClientSection) => {
    navigate(sectionToPath(section));
  }, [navigate]);

  const { previousBalance, handleTokenDeduct } = useDashboardStats(tokenBalance, onTokenBalanceChange);

  const onHandleLogout = () => handleLogout(onLogout);

  // Builder mode routes
  const isBuilderRoute = location.pathname.startsWith('/client/chatbots/') &&
    location.pathname !== '/client/chatbots';
  const isNewChatbot = location.pathname === '/client/chatbots/new';
  const isEditChatbot = /^\/client\/chatbots\/[^/]+$/.test(location.pathname) && !isNewChatbot;

  if (isBuilderRoute) {
    return (
      <CommandKProvider>
        <div className="flex h-screen bg-[#11100b] overflow-hidden">
          <Sidebar
            activeSection="chatbots"
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            clientName={client.name}
            tokenBalance={tokenBalance}
            onLogout={onHandleLogout}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
              {clientToken && (
                <ChatbotBuilderShell
                  clientToken={clientToken}
                  instances={instances}
                />
              )}
            </div>
            <BottomNav
              activeMenuItem="chatbots"
              onMenuItemChange={handleSectionChange}
              onLogout={onHandleLogout}
            />
          </div>
          <UpdateToast />
        </div>
      </CommandKProvider>
    );
  }

  return (
    <CommandKProvider>
    <div className="flex h-screen bg-[#11100b] overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        clientName={client.name}
        tokenBalance={tokenBalance}
        onLogout={onHandleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <ClientContent
            activeSection={activeSection}
            client={client}
            clientToken={clientToken}
            instances={instances}
            tokenBalance={tokenBalance}
            tokenPackages={tokenPackages}
            dailyUsage={dailyUsage}
            messagesToday={messagesToday}
            previousBalance={previousBalance}
            onInstancesChange={onInstancesChange}
            onTokenBalanceChange={onTokenBalanceChange}
            onTokenDeduct={handleTokenDeduct}
            onLogout={onHandleLogout}
          />
        </div>
        <BottomNav
          activeMenuItem={activeSection}
          onMenuItemChange={handleSectionChange}
          onLogout={onHandleLogout}
        />
      </div>
      <UpdateToast />
    </div>
    </CommandKProvider>
  );
}
