import React, { useState, useEffect } from 'react';
import BulkMessagingPanel from './BulkMessagingPanel';
import { contactsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';

interface CampaignsViewProps {
  clientToken?: string;
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

export default function CampaignsView({ clientToken, instances, onTokenDeduct }: CampaignsViewProps) {
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!clientToken) return;
    contactsApi.getAll().then(res => {
      if (res.success && res.data) setSavedContacts(res.data);
    });
  }, [clientToken]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#eaebe4] bg-white shrink-0">
        <h2 className="text-base font-bold text-forest-deep">Campaigns</h2>
        <p className="text-xs text-graphite mt-0.5">Create and manage bulk messaging campaigns</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <BulkMessagingPanel
          instances={instances.filter(i => i.status === 'connected')}
          savedContacts={savedContacts}
          clientToken={clientToken}
          onTokenDeduct={onTokenDeduct}
        />
      </div>
    </div>
  );
}
