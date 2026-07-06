import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Zap, Copy, Trash2 } from 'lucide-react';
import { campaignsApi } from '../../../services/api';
import type { Campaign, CampaignRecipient } from '../../../services/api';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-[#2d2813] text-[#a8a99e]',
  scheduled: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  sending: 'bg-yellow-900/30 text-yellow-500 border-yellow-700/50 animate-pulse',
  completed: 'bg-green-900/40 text-green-400 border-green-800/50',
  cancelled: 'bg-red-900/30 text-red-400 border-red-800/40',
  failed: 'bg-red-900/30 text-red-400 border-red-800/40',
};

export default function BulkMessagingPreview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);

  useEffect(() => {
    campaignsApi.getAll().then(res => { if (res.success && res.data) setCampaigns(res.data); });
  }, []);

  const handleSelect = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const res = await campaignsApi.getOne(campaign.id);
    if (res.success && res.data) setRecipients(res.data.recipients);
  };

  const handleDuplicate = async (campaign: Campaign) => {
    const res = await campaignsApi.duplicate(campaign.id);
    if (res.success && res.data) setCampaigns(prev => [res.data!, ...prev]);
  };

  const handleDelete = async (campaign: Campaign) => {
    await campaignsApi.delete(campaign.id);
    setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    if (selectedCampaign?.id === campaign.id) {
      setSelectedCampaign(null);
      setRecipients([]);
    }
  };

  const formatDate = (ts: string | null) => {
    if (!ts) return 'Not scheduled';
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (selectedCampaign) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#2d2813] bg-[#1a1915] flex items-center gap-2 shrink-0">
          <button onClick={() => { setSelectedCampaign(null); setRecipients([]); }} className="w-7 h-7 rounded-lg hover:bg-[#2d2813] flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-[#6e684a] rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#a8a99e] truncate">{selectedCampaign.name}</p>
            <p className="text-[9px] text-[#6e684a]">{selectedCampaign.instance_name}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_COLORS[selectedCampaign.status] || 'bg-[#2d2813] text-[#a8a99e]'}`}>
            {selectedCampaign.status}
          </span>
        </div>

        <div className="p-3 border-b border-[#2d2813] grid grid-cols-4 gap-2 shrink-0">
          <div className="text-center">
            <p className="text-sm font-bold text-[#eab308]">{selectedCampaign.total_recipients}</p>
            <p className="text-[8px] text-[#6e684a]">Total</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-green-400">{selectedCampaign.sent_count}</p>
            <p className="text-[8px] text-[#6e684a]">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-blue-400">{selectedCampaign.delivered_count}</p>
            <p className="text-[8px] text-[#6e684a]">Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-red-400">{selectedCampaign.failed_count}</p>
            <p className="text-[8px] text-[#6e684a]">Failed</p>
          </div>
        </div>

        {selectedCampaign.content && (
          <div className="p-3 border-b border-[#2d2813]">
            <p className="text-[9px] font-bold text-[#6e684a] uppercase mb-1">Message</p>
            <p className="text-xs text-[#a8a99e] bg-[#181711] rounded-xl p-3">{selectedCampaign.content}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <p className="text-[9px] font-bold text-[#6e684a] uppercase px-3 pt-3 pb-2">Recipients ({recipients.length})</p>
          {recipients.map(r => (
            <div key={r.id} className="px-3 py-2 border-b border-[#2d2813]/50 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono text-[#a8a99e]">{r.phone}</p>
                <p className="text-[9px] text-[#6e684a]">
                  {r.sent_at ? `Sent ${new Date(r.sent_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Pending'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                r.status === 'delivered' ? 'bg-green-900/40 text-green-400 border-green-800/50' :
                r.status === 'sent' ? 'bg-blue-900/40 text-blue-400 border-blue-800/50' :
                r.status === 'failed' ? 'bg-red-900/30 text-red-400 border-red-800/40' :
                'bg-[#2d2813] text-[#a8a99e]'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#2d2813] flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-[#6e684a]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#a8a99e]">No campaigns yet</p>
            <p className="text-[10px] text-[#6e684a] mt-1">Create your first campaign to send bulk messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {campaigns.map(campaign => (
        <div
          key={campaign.id}
          className="p-3 border-b border-[#2d2813] hover:bg-[#181711] transition-all cursor-pointer"
          onClick={() => handleSelect(campaign)}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#a8a99e] truncate">{campaign.name}</p>
              <p className="text-[9px] text-[#6e684a] font-mono">{campaign.instance_name}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_COLORS[campaign.status] || 'bg-[#2d2813] text-[#a8a99e]'}`}>
                {campaign.status}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleDuplicate(campaign); }} className="w-6 h-6 rounded-lg hover:bg-[#2d2813] flex items-center justify-center" title="Duplicate">
                <Copy className="w-3 h-3 text-[#6e684a]" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(campaign); }} className="w-6 h-6 rounded-lg hover:bg-red-900/30 flex items-center justify-center" title="Delete">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#6e684a] line-clamp-1">{campaign.content}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[#6e684a]">
            <span>{formatDate(campaign.created_at)}</span>
            <span>•</span>
            <span>{campaign.total_recipients} recipients</span>
            {campaign.delivered_count > 0 && (<><span>•</span><span className="text-green-400">{campaign.delivered_count} delivered</span></>)}
          </div>
        </div>
      ))}
    </div>
  );
}
