import { useState, useEffect } from 'react';
import { Megaphone, Image as ImageIcon, Sparkles } from 'lucide-react';
import { contactsApi, campaignsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';
import CampaignList from './CampaignList';
import CampaignBuilder from './CampaignBuilder';
import { MediaLibrary } from '../media/index.js';

interface MarketingCenterProps {
  clientToken?: string;
  instances: Instance[];
}

type Tab = 'campaigns' | 'library';

/**
 * Phase 5 Marketing Center — Slice A + B. The hub for non-bulk campaign work.
 * Slice A: Broadcast builder + list view with type filter.
 * Slice B: Media library tab (reusable assets referenced by campaigns).
 * Future slices add: Segments (C), Trigger/drip flows (D), Status (E) — each
 * as its own tab here.
 */
export default function MarketingCenter({ clientToken, instances }: MarketingCenterProps) {
  const [tab, setTab] = useState<Tab>('campaigns');
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
            Broadcasts today · Media library · Segments, trigger &amp; drip flows coming next. Shares the same send pipeline as 1:1 chat — failed sends refund tokens automatically.
          </p>
        </div>
        <Megaphone className="w-5 h-5 text-yellow-700 shrink-0" />
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl w-fit">
        <button onClick={() => setTab('campaigns')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tab === 'campaigns' ? 'bg-forest-deep text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
          <Megaphone className="w-3.5 h-3.5" /> Campaigns
        </button>
        <button onClick={() => setTab('library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tab === 'library' ? 'bg-forest-deep text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
          <ImageIcon className="w-3.5 h-3.5" /> Media library
        </button>
      </div>

      {tab === 'library' ? (
        <MediaLibrary />
      ) : view === 'list' ? (
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
