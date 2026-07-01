import React, { useState, useEffect } from 'react';
import { Megaphone, Send } from 'lucide-react';
import BulkMessagingPanel from './BulkMessagingPanel';
import { MarketingCenter } from '../../features/campaigns/index.js';
import { contactsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';

interface CampaignsViewProps {
  clientToken?: string;
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

type Tab = 'marketing' | 'bulk';

export default function CampaignsView({ clientToken, instances, onTokenDeduct }: CampaignsViewProps) {
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [tab, setTab] = useState<Tab>('marketing');

  useEffect(() => {
    if (!clientToken) return;
    contactsApi.getAll().then(res => {
      if (res.success && res.data) setSavedContacts(res.data);
    });
  }, [clientToken]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#2d2813] bg-[#1a1915] shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-[#eab308]">Campaigns</h2>
            <p className="text-xs text-[#6e684a] mt-0.5">Marketing center + classic bulk messaging</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-[#181711] border border-[#2d2813] rounded-xl">
            <button onClick={() => setTab('marketing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'marketing' ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#181711]/50'}`}>
              <Megaphone className="w-3.5 h-3.5" /> Marketing Center
            </button>
            <button onClick={() => setTab('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'bulk' ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#181711]/50'}`}>
              <Send className="w-3.5 h-3.5" /> Bulk Messaging
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl overflow-hidden h-full flex flex-col">
          {tab === 'marketing' ? (
            <div className="p-5">
              <MarketingCenter clientToken={clientToken} instances={instances} />
            </div>
          ) : (
            <BulkMessagingPanel
              instances={instances.filter(i => i.status === 'connected')}
              savedContacts={savedContacts}
              clientToken={clientToken}
              onTokenDeduct={onTokenDeduct}
            />
          )}
        </div>
      </div>
    </div>
  );
}
