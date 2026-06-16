import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Client, Instance, TokenPackage, DailyUsage, ClientMessage } from '../../services/api';
import Sidebar, { ClientSection } from '../Sidebar';
import BottomNav from '../shared/BottomNav';
import { UpdateToast } from '../shared/UpdateToast';
import ClientContent from './ClientContent';
import { useInstanceSSE, type InstanceStateChange } from './whatsapp/useInstanceSSE';
import { CommandKProvider } from '../../features/search/index.js';

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
  const [previousBalance, setPreviousBalance] = useState<number | undefined>();

  const activeSection = pathToSection(location.pathname);

  // Always-on real-time bridge: keeps SSE alive on every page (messages,
  // dashboard, etc.), not just the containers grid. Updates flow back through
  // onInstancesChange so every consumer re-renders with fresh status.
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

  const handleTokenDeduct = useCallback((amount: number) => {
    setPreviousBalance(tokenBalance);
    onTokenBalanceChange(Math.max(0, tokenBalance - amount));
  }, [tokenBalance, onTokenBalanceChange]);

  // Clear previousBalance when tokenBalance is updated from SSE (real-time sync)
  useEffect(() => {
    setPreviousBalance(undefined);
  }, [tokenBalance]);

  const handleLogout = () => {
    localStorage.removeItem('fidscript_client_token');
    onLogout();
  };

  return (
    <CommandKProvider>
    <div className="flex h-screen bg-[#11100b] overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        clientName={client.name}
        tokenBalance={tokenBalance}
        onLogout={handleLogout}
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
            recentMessages={recentMessages}
            messagesToday={messagesToday}
            previousBalance={previousBalance}
            onInstancesChange={onInstancesChange}
            onTokenBalanceChange={onTokenBalanceChange}
            onTokenDeduct={handleTokenDeduct}
            onLogout={handleLogout}
          />
        </div>

        <BottomNav
          activeMenuItem={activeSection}
          onMenuItemChange={handleSectionChange}
          onLogout={handleLogout}
        />
      </div>

      <UpdateToast />
    </div>
    </CommandKProvider>
  );
}
