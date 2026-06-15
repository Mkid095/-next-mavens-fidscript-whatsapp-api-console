import { useState, useEffect } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
import { contactsApi, campaignsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';
import CampaignList from './CampaignList';
import CampaignBuilder from './CampaignBuilder';

interface MarketingCenterProps {
  clientToken?: string;
  instances: Instance[];
}

/**
 * Phase 5 Marketing Center — Slice A. The hub for non-bulk campaign work.
 * Currently hosts: Broadcast builder + a list view with type filter.
 * Future slices add: segments (C), trigger/drip flows (D), media library (B),
 * status module (E) — each as its own tab here.
 */
export default function MarketingCenter({ clientToken, instances }: MarketingCenterProps) {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!clientToken) return;
    contactsApi.getAll().then(res => {
      if (res.success && res.data) setSavedContacts(res.data);
    });
  }, [clientToken]);

  const handleLaunch = async (id: string) => {
    await campaignsApi.send(id);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-forest-deep">Marketing Center</p>
          <p className="text-[10px] text-graphite">
            Broadcasts today · Segments · Trigger &amp; drip flows coming next. Shares the same send pipeline as 1:1 chat — failed sends refund tokens automatically.
          </p>
        </div>
        <Megaphone className="w-5 h-5 text-yellow-700 shrink-0" />
      </div>

      {view === 'list' ? (
        <CampaignList
          key={refreshKey}
          clientToken={clientToken}
          onCreate={() => setView('builder')}
          onLaunch={handleLaunch}
        />
      ) : (
        <CampaignBuilder
          clientToken={clientToken}
          instances={instances.filter(i => i.status === 'connected')}
          savedContacts={savedContacts}
          onBack={() => setView('list')}
          onCreated={() => { setView('list'); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
