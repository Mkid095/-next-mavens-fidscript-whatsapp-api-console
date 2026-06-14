import React from 'react';
import type { Client, Instance, TokenPackage, DailyUsage } from '../../services/api';
import TokenBalanceBar from '../TokenBalanceBar';
import DashboardHome from './DashboardHome';
import WhatsAppContainers from './whatsapp/WhatsAppContainers';
import ApiKeysSection from './ApiKeysSection';
import DocsSection from './DocsSection';
import SandboxSection from './SandboxSection';
import MessagesView from './MessagesView';
import CampaignsView from './CampaignsView';
import ContactsSection from './contacts/ContactsSection';
import TokenStoreSection from './TokenStoreSection';
import SettingsSection from './SettingsSection';

interface ClientContentProps {
  activeSection: string;
  client: Client;
  clientToken?: string;
  instances: Instance[];
  tokenBalance: number;
  tokenPackages: TokenPackage[];
  dailyUsage: DailyUsage[];
  recentMessages: ClientMessage[];
  messagesToday: number;
  previousBalance?: number;
  onInstancesChange: (instances: Instance[]) => void;
  onTokenBalanceChange: (balance: number) => void;
  onTokenDeduct: (amount: number) => void;
  onLogout: () => void;
}

export default function ClientContent({
  activeSection,
  client,
  clientToken,
  instances,
  tokenBalance,
  tokenPackages,
  dailyUsage,
  recentMessages,
  messagesToday,
  previousBalance,
  onInstancesChange,
  onTokenBalanceChange,
  onTokenDeduct,
  onLogout,
}: ClientContentProps) {
  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <TokenBalanceBar balance={tokenBalance} previousBalance={previousBalance} />

      {activeSection === 'dashboard' && (
        <DashboardHome
          client={client}
          tokenBalance={tokenBalance}
          instances={instances}
          dailyUsage={dailyUsage}
          recentMessages={[]}
        />
      )}
      {activeSection === 'whatsapp' && (
        <WhatsAppContainers
          client={client}
          clientToken={clientToken}
          instances={instances}
          onInstancesChange={onInstancesChange}
          onTokenDeduct={onTokenDeduct}
        />
      )}
      {activeSection === 'api-keys' && (
        <ApiKeysSection clientToken={clientToken} />
      )}
      {activeSection === 'docs' && (
        <DocsSection client={client} />
      )}
      {activeSection === 'sandbox' && (
        <SandboxSection
          clientToken={clientToken}
          instances={instances}
          tokenBalance={tokenBalance}
          onTokenDeduct={onTokenDeduct}
        />
      )}
      {activeSection === 'messages' && (
        <MessagesView
          clientToken={clientToken}
          instances={instances}
          onTokenDeduct={onTokenDeduct}
        />
      )}
      {activeSection === 'campaigns' && (
        <CampaignsView
          clientToken={clientToken}
          instances={instances}
          onTokenDeduct={onTokenDeduct}
        />
      )}
      {activeSection === 'contacts' && (
        <ContactsSection
          client={client}
          clientToken={clientToken}
        />
      )}
      {activeSection === 'token-store' && (
        <TokenStoreSection
          client={client}
          tokenPackages={tokenPackages}
          tokenBalance={tokenBalance}
          onTokenBalanceChange={onTokenBalanceChange}
          onTokenDeduct={onTokenDeduct}
        />
      )}
      {activeSection === 'settings' && (
        <SettingsSection client={client} onLogout={onLogout} />
      )}
    </div>
  );
}
