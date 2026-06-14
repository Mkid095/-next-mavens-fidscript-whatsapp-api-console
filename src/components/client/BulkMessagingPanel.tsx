import React, { useState, useEffect } from 'react';
import {
  Search, X, Plus, ChevronDown, RefreshCw, Zap, AlertCircle, Check,
  Users, Clock, Calendar, Trash2, Play, Pause, Copy, SendHorizontal,
  FileText, Eye, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { campaignsApi, groupsApi } from '../../services/api';
import type { Instance, Contact, ContactGroup, Campaign, CampaignRecipient } from '../../services/api';

interface BulkMessagingPanelProps {
  instances: Instance[];
  savedContacts: Contact[];
  clientToken?: string;
  onTokenDeduct?: (n: number) => void;
  onClose: () => void;
}

type Step = 'create' | 'history';

export default function BulkMessagingPanel({
  instances,
  savedContacts,
  clientToken,
  onTokenDeduct,
  onClose,
}: BulkMessagingPanelProps) {
  const [step, setStep] = useState<Step>('create');
  const [campaignName, setCampaignName] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.name || '');
  const [messageText, setMessageText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [phoneInput, setPhoneInput] = useState('');
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<CampaignRecipient[]>([]);

  useEffect(() => {
    groupsApi.getAll().then(res => {
      if (res.success && res.data) setGroups(res.data);
    });
    campaignsApi.getAll().then(res => {
      if (res.success && res.data) setCampaigns(res.data);
    });
  }, []);

  const allPhones = [
    ...(selectedGroup ? [] : Array.from(selectedContacts)),
    ...extraPhones.map(p => p.replace(/\D/g, '')).filter(Boolean),
  ];

  const toggleContact = (phone: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const addPhone = () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (phone && !allPhones.includes(phone)) {
      setExtraPhones(prev => [...prev, phone]);
      setPhoneInput('');
    }
  };

  const recipientCount = selectedGroup
    ? groups.find(g => g.id === selectedGroup)?.member_count || 0
    : allPhones.length;

  const totalCost = messageText.trim() ? recipientCount : 0;

  const handleCreateAndSend = async () => {
    if (!campaignName.trim() || !selectedInstance || recipientCount === 0 || !messageText.trim()) return;
    setCreating(true);
    setError('');
    try {
      const payload: any = {
        name: campaignName,
        instance_name: selectedInstance,
        message_type: 'text',
        content: messageText,
        scheduled_at: scheduledAt || undefined,
      };
      if (selectedGroup) {
        payload.group_id = selectedGroup;
      } else {
        payload.phone_numbers = allPhones;
      }
      const res = await campaignsApi.create(payload);
      if (res.success && res.data) {
        const sendRes = await campaignsApi.send(res.data.id);
        if (sendRes.success) {
          onTokenDeduct?.(sendRes.data?.tokens_deducted || totalCost);
          setCampaignName('');
          setMessageText('');
          setSelectedContacts(new Set());
          setExtraPhones([]);
          setSelectedGroup('');
          setCampaigns(prev => [res.data!, ...prev]);
          setStep('history');
        } else {
          setError(sendRes.error || 'Failed to start campaign');
        }
      } else {
        setError(res.error || 'Failed to create campaign');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleViewCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const res = await campaignsApi.getOne(campaign.id);
    if (res.success && res.data) {
      setCampaignRecipients(res.data.recipients);
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    const res = await campaignsApi.duplicate(campaign.id);
    if (res.success && res.data) {
      setCampaigns(prev => [res.data!, ...prev]);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    await campaignsApi.delete(campaign.id);
    setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    if (selectedCampaign?.id === campaign.id) {
      setSelectedCampaign(null);
      setCampaignRecipients([]);
    }
  };

  const formatDate = (ts: string | null) => {
    if (!ts) return 'Not scheduled';
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Step toggle */}
      <div className="p-3 border-b border-[#eaebe4] shrink-0">
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setStep('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              step === 'create' ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Create
          </button>
          <button
            onClick={() => setStep('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              step === 'history' ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>

      {step === 'create' ? (
        <CreatePanel
          campaignName={campaignName}
          onCampaignNameChange={setCampaignName}
          selectedInstance={selectedInstance}
          onInstanceChange={setSelectedInstance}
          instances={instances}
          messageText={messageText}
          onMessageChange={setMessageText}
          selectedContacts={selectedContacts}
          onToggleContact={toggleContact}
          savedContacts={savedContacts}
          phoneInput={phoneInput}
          onPhoneInputChange={setPhoneInput}
          extraPhones={extraPhones}
          onAddPhone={addPhone}
          onRemovePhone={(p) => setExtraPhones(prev => prev.filter(x => x !== p))}
          scheduledAt={scheduledAt}
          onScheduledChange={setScheduledAt}
          groups={groups}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
          recipientCount={recipientCount}
          totalCost={totalCost}
          creating={creating}
          error={error}
          onCreate={handleCreateAndSend}
        />
      ) : (
        <HistoryPanel
          campaigns={campaigns}
          selectedCampaign={selectedCampaign}
          recipients={campaignRecipients}
          onSelect={handleViewCampaign}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onCloseDetails={() => { setSelectedCampaign(null); setCampaignRecipients([]); }}
          formatDate={formatDate}
          statusColors={statusColors}
        />
      )}
    </div>
  );
}

interface CreatePanelProps {
  campaignName: string;
  onCampaignNameChange: (v: string) => void;
  selectedInstance: string;
  onInstanceChange: (v: string) => void;
  instances: Instance[];
  messageText: string;
  onMessageChange: (v: string) => void;
  selectedContacts: Set<string>;
  onToggleContact: (phone: string) => void;
  savedContacts: Contact[];
  phoneInput: string;
  onPhoneInputChange: (v: string) => void;
  extraPhones: string[];
  onAddPhone: () => void;
  onRemovePhone: (p: string) => void;
  scheduledAt: string;
  onScheduledChange: (v: string) => void;
  groups: ContactGroup[];
  selectedGroup: string;
  onGroupChange: (v: string) => void;
  recipientCount: number;
  totalCost: number;
  creating: boolean;
  error: string;
  onCreate: () => void;
}

function CreatePanel({
  campaignName,
  onCampaignNameChange,
  selectedInstance,
  onInstanceChange,
  instances,
  messageText,
  onMessageChange,
  selectedContacts,
  onToggleContact,
  savedContacts,
  phoneInput,
  onPhoneInputChange,
  extraPhones,
  onAddPhone,
  onRemovePhone,
  scheduledAt,
  onScheduledChange,
  groups,
  selectedGroup,
  onGroupChange,
  recipientCount,
  totalCost,
  creating,
  error,
  onCreate,
}: CreatePanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* Campaign name */}
      <div>
        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Campaign Name</label>
        <input
          value={campaignName}
          onChange={e => onCampaignNameChange(e.target.value)}
          placeholder="e.g. June Promotion"
          className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
        />
      </div>

      {/* Container */}
      <div>
        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Container</label>
        <div className="relative mt-1">
          <select
            value={selectedInstance}
            onChange={e => onInstanceChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white appearance-none"
          >
            {instances.map(inst => (
              <option key={inst.name} value={inst.name}>
                {inst.display_name || inst.name}{inst.phone_number ? ` (${inst.phone_number})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
        </div>
      </div>

      {/* Recipients - Group */}
      <div>
        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">Recipients</label>
        <div className="relative">
          <select
            value={selectedGroup}
            onChange={e => { onGroupChange(e.target.value); if (e.target.value) onToggleContact; }}
            className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white appearance-none"
          >
            <option value="">-- Select a group --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.member_count} contacts)</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
        </div>
        {selectedGroup && groups.find(g => g.id === selectedGroup) && (
          <p className="text-[9px] text-green-600 mt-1">
            <Users className="w-3 h-3 inline mr-1" />
            {groups.find(g => g.id === selectedGroup)?.member_count} contacts from group
          </p>
        )}
      </div>

      {/* Manual contacts - only if no group */}
      {!selectedGroup && (
        <>
          {savedContacts.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">
                Select contacts ({selectedContacts.size} selected)
              </label>
              <div className="max-h-32 overflow-y-auto border border-[#eaebe4] rounded-xl bg-white">
                {savedContacts.map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer border-b border-[#eaebe4]/50 last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(c.phone)}
                      onChange={() => onToggleContact(c.phone)}
                      className="w-3.5 h-3.5 rounded accent-yellow-500"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-forest-deep">{c.name || c.phone}</p>
                      <p className="text-[9px] text-stone-400 font-mono">{c.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Extra phones */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Add numbers</label>
            <div className="flex gap-1.5 mt-1">
              <input
                value={phoneInput}
                onChange={e => onPhoneInputChange(e.target.value)}
                placeholder="254712345678"
                className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddPhone(); } }}
              />
              <button onClick={onAddPhone} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-bold text-stone-600 transition-all">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {extraPhones.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {extraPhones.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-mono flex items-center gap-1">
                    {p}
                    <button onClick={() => onRemovePhone(p)}><X className="w-2.5 h-2.5 text-stone-400" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Message */}
      <div>
        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Message</label>
        <textarea
          value={messageText}
          onChange={e => onMessageChange(e.target.value)}
          rows={4}
          placeholder="Type your message..."
          className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-stone-400">{recipientCount} recipients</span>
          <span className="text-[9px] text-stone-400">{totalCost} tokens</span>
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Schedule (optional)</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => onScheduledChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
        />
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={onCreate}
        disabled={recipientCount === 0 || !messageText.trim() || !campaignName.trim() || creating}
        className="w-full py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        {creating ? 'Creating...' : `Send Campaign (${totalCost} tokens)`}
      </button>
    </div>
  );
}

interface HistoryPanelProps {
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

function HistoryPanel({
  campaigns,
  selectedCampaign,
  recipients,
  onSelect,
  onDuplicate,
  onDelete,
  onCloseDetails,
  formatDate,
  statusColors,
}: HistoryPanelProps) {
  if (selectedCampaign) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Campaign detail header */}
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

        {/* Campaign stats */}
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

        {/* Message preview */}
        {selectedCampaign.content && (
          <div className="p-3 border-b border-[#eaebe4]">
            <p className="text-[9px] font-bold text-stone-500 uppercase mb-1">Message</p>
            <p className="text-xs text-forest-deep bg-stone-50 rounded-xl p-3">{selectedCampaign.content}</p>
          </div>
        )}

        {/* Recipients list */}
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
