import { motion } from 'motion/react';
import { ChevronRight, Zap, Copy, Trash2 } from 'lucide-react';
import type { Campaign, CampaignRecipient } from '../../services/api';

export interface HistoryPanelProps {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  recipients: CampaignRecipient[];
  onSelect: (c: Campaign) => void;
  onDuplicate: (c: Campaign) => void;
  onDelete: (c: Campaign) => void;
  onCloseDetails: () => void;
  formatDate: (ts: string | null) => string;
  statusColors: Record<string, string>;
}

export default function HistoryPanel({
  campaigns, selectedCampaign, recipients,
  onSelect, onDuplicate, onDelete, onCloseDetails,
  formatDate, statusColors,
}: HistoryPanelProps) {
  if (selectedCampaign) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#eaebe4] bg-[#fafaf5] flex items-center gap-2 shrink-0">
          <button onClick={onCloseDetails} className="w-7 h-7 rounded-lg hover:bg-stone-200 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-stone-500 rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-forest-deep truncate">{selectedCampaign.name}</p>
            <p className="text-[9px] text-stone-500">{selectedCampaign.instance_name}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColors[selectedCampaign.status]}`}>
            {selectedCampaign.status}
          </span>
        </div>

        <div className="p-3 border-b border-[#eaebe4] grid grid-cols-4 gap-2 shrink-0">
          <div className="text-center">
            <p className="text-sm font-bold text-forest-deep">{selectedCampaign.total_recipients}</p>
            <p className="text-[8px] text-stone-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-green-600">{selectedCampaign.sent_count}</p>
            <p className="text-[8px] text-stone-500">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-blue-600">{selectedCampaign.delivered_count}</p>
            <p className="text-[8px] text-stone-500">Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-red-500">{selectedCampaign.failed_count}</p>
            <p className="text-[8px] text-stone-500">Failed</p>
          </div>
        </div>

        {selectedCampaign.content && (
          <div className="p-3 border-b border-[#eaebe4]">
            <p className="text-[9px] font-bold text-stone-500 uppercase mb-1">Message</p>
            <p className="text-xs text-forest-deep bg-stone-50 rounded-xl p-3">{selectedCampaign.content}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <p className="text-[9px] font-bold text-stone-500 uppercase px-3 pt-3 pb-2">Recipients ({recipients.length})</p>
          {recipients.map(r => (
            <div key={r.id} className="px-3 py-2 border-b border-[#eaebe4]/50 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono text-forest-deep">{r.phone}</p>
                <p className="text-[9px] text-stone-400">
                  {r.sent_at ? `Sent ${new Date(r.sent_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Pending'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                r.status === 'delivered' ? 'bg-green-100 text-green-700' :
                r.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                r.status === 'failed' ? 'bg-red-100 text-red-600' :
                'bg-stone-100 text-stone-600'
              }`}>
                {r.status}
              </span>
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
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-stone-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-forest-deep">No campaigns yet</p>
            <p className="text-[10px] text-graphite mt-1">Create your first campaign to send bulk messages</p>
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
          className="p-3 border-b border-[#eaebe4] hover:bg-stone-50 transition-all cursor-pointer"
          onClick={() => onSelect(campaign)}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-forest-deep truncate">{campaign.name}</p>
              <p className="text-[9px] text-stone-500 font-mono">{campaign.instance_name}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColors[campaign.status]}`}>
                {campaign.status}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(campaign); }}
                className="w-6 h-6 rounded-lg hover:bg-stone-200 flex items-center justify-center"
                title="Duplicate"
              >
                <Copy className="w-3 h-3 text-stone-400" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(campaign); }}
                className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-stone-500 line-clamp-1">{campaign.content}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-stone-400">
            <span>{formatDate(campaign.created_at)}</span>
            <span>•</span>
            <span>{campaign.total_recipients} recipients</span>
            {campaign.delivered_count > 0 && (
              <>
                <span>•</span>
                <span className="text-green-600">{campaign.delivered_count} delivered</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
