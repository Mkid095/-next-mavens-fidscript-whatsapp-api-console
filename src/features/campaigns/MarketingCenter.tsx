import { useState, useEffect } from 'react';
import { Megaphone, Image as ImageIcon, Users, Sparkles, Radio } from 'lucide-react';
import { contactsApi, campaignsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';
import CampaignList from './CampaignList';
import CampaignBuilder from './CampaignBuilder';
import { MediaLibrary } from '../media/index.js';
import { SegmentList, SegmentBuilder } from '../segments/index.js';
import { StatusPane } from '../statuses/index.js';

interface MarketingCenterProps {
  clientToken?: string;
  instances: Instance[];
}

type Tab = 'campaigns' | 'library' | 'segments' | 'statuses';

/**
 * Phase 5 Marketing Center - Slices A-E. The hub for non-bulk campaign work.
 * Slice A: Broadcast builder + list view with type filter.
 * Slice B: Media library tab (reusable assets referenced by campaigns).
 * Slice C: Segments tab (named audience filters with preview).
 * Slice D: Drip + trigger flows (embedded in CampaignBuilder type=drip|trigger).
 * Slice E: Statuses tab (text/image/audio to the WhatsApp status feed).
 */
export default function MarketingCenter({ clientToken, instances }: MarketingCenterProps) {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [segView, setSegView] = useState<'list' | 'builder'>('list');
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
      <div className="p-4 bg-[#181711] border border-[#2d2813] rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#2d2813] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-[#eab308]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#a8a99e]">Marketing Center</p>
          <p className="text-[10px] text-[#6e684a]">
            Broadcasts · Media library · Segments · Drip flows · Status posts. Shares the same send pipeline as 1:1 chat - failed sends refund tokens automatically.
          </p>
        </div>
        <Megaphone className="w-5 h-5 text-[#eab308] shrink-0" />
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#181711] border border-[#2d2813] rounded-xl w-fit flex-wrap">
        <button onClick={() => setTab('campaigns')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tab === 'campaigns' ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813]/50'}`}>
          <Megaphone className="w-3.5 h-3.5" /> Campaigns
        </button>
        <button onClick={() => setTab('library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tab === 'library' ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813]/50'}`}>
          <ImageIcon className="w-3.5 h-3.5" /> Media library
        </button>
        <button onClick={() => setTab('segments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tab === 'segments' ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813]/50'}`}>
          <Users className="w-3.5 h-3.5" /> Segments
        </button>
        <button onClick={() => setTab('statuses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tab === 'statuses' ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813]/50'}`}>
          <Radio className="w-3.5 h-3.5" /> Statuses
        </button>
      </div>

      {tab === 'library' ? (
        <MediaLibrary />
      ) : tab === 'segments' ? (
        segView === 'list' ? (
          <SegmentList onCreate={() => setSegView('builder')} />
        ) : (
          <SegmentBuilder onBack={() => setSegView('list')} onSaved={() => setSegView('list')} />
        )
      ) : tab === 'statuses' ? (
        <StatusPane instances={instances} />
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
