import { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';
import { campaignsApi, groupsApi } from '../../services/api';
import type { Instance, Contact, ContactGroup, Campaign, CampaignRecipient } from '../../services/api';
import CreatePanel from './bulk/CreatePanel.js';
import HistoryPanel from './bulk/HistoryPanel.js';

interface BulkMessagingPanelProps {
  instances: Instance[];
  savedContacts: Contact[];
  clientToken?: string;
  onTokenDeduct?: (n: number) => void;
  onClose?: () => void;
}

type Step = 'create' | 'history';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-[#2d2813] text-[#a8a99e]',
  scheduled: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  sending: 'bg-yellow-900/30 text-yellow-500 border-yellow-700/50 animate-pulse',
  completed: 'bg-green-900/40 text-green-400 border-green-800/50',
  cancelled: 'bg-red-900/30 text-red-400 border-red-800/40',
  failed: 'bg-red-900/30 text-red-400 border-red-800/40',
};

/**
 * Phase 1 — Bulk messaging panel. Two-step UI: create a campaign (audience
 * from saved contacts / groups / pasted phones, message, schedule), then
 * inspect history with per-recipient delivery status. The two sub-panels
 * live in `bulk/` to keep this orchestrator small.
 */
export default function BulkMessagingPanel({
  instances, savedContacts, onTokenDeduct,
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
    groupsApi.getAll().then(res => { if (res.success && res.data) setGroups(res.data); });
    campaignsApi.getAll().then(res => { if (res.success && res.data) setCampaigns(res.data); });
  }, []);

  const allPhones = [
    ...(selectedGroup ? [] : Array.from(selectedContacts)),
    ...extraPhones.map(p => p.replace(/\D/g, '')).filter(Boolean),
  ];

  const toggleContact = (phone: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
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
      const payload: { name: string; instance_name: string; message_type: string; content: string; scheduled_at?: string; group_id?: string; phone_numbers?: string[] } = {
        name: campaignName, instance_name: selectedInstance,
        message_type: 'text', content: messageText,
        scheduled_at: scheduledAt || undefined,
      };
      if (selectedGroup) payload.group_id = selectedGroup;
      else payload.phone_numbers = allPhones;
      const res = await campaignsApi.create(payload);
      if (res.success && res.data) {
        const sendRes = await campaignsApi.send(res.data.id);
        if (sendRes.success) {
          onTokenDeduct?.(sendRes.data?.tokens_deducted || totalCost);
          setCampaignName(''); setMessageText(''); setSelectedContacts(new Set());
          setExtraPhones([]); setSelectedGroup('');
          setCampaigns(prev => [res.data!, ...prev]);
          setStep('history');
        } else { setError(sendRes.error || 'Failed to start campaign'); }
      } else { setError(res.error || 'Failed to create campaign'); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setCreating(false); }
  };

  const handleViewCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const res = await campaignsApi.getOne(campaign.id);
    if (res.success && res.data) setCampaignRecipients(res.data.recipients);
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
      setCampaignRecipients([]);
    }
  };

  const formatDate = (ts: string | null) => {
    if (!ts) return 'Not scheduled';
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[#2d2813] shrink-0">
        <div className="flex items-center gap-1 p-1 bg-[#181711] border border-[#2d2813] rounded-xl">
          <button
            onClick={() => setStep('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${step === 'create' ? 'bg-[#eab308] text-[#181711] font-semibold' : 'text-[#6e684a] hover:text-[#a8a99e]'}`}
          >
            <Zap className="w-3.5 h-3.5" /> Create
          </button>
          <button
            onClick={() => setStep('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${step === 'history' ? 'bg-[#eab308] text-[#181711] font-semibold' : 'text-[#6e684a] hover:text-[#a8a99e]'}`}
          >
            <Clock className="w-3.5 h-3.5" /> History
          </button>
        </div>
      </div>

      {step === 'create' ? (
        <CreatePanel
          campaignName={campaignName} onCampaignNameChange={setCampaignName}
          selectedInstance={selectedInstance} onInstanceChange={setSelectedInstance} instances={instances}
          messageText={messageText} onMessageChange={setMessageText}
          selectedContacts={selectedContacts} onToggleContact={toggleContact} savedContacts={savedContacts}
          phoneInput={phoneInput} onPhoneInputChange={setPhoneInput}
          extraPhones={extraPhones} onAddPhone={addPhone}
          onRemovePhone={p => setExtraPhones(prev => prev.filter(x => x !== p))}
          scheduledAt={scheduledAt} onScheduledChange={setScheduledAt}
          groups={groups} selectedGroup={selectedGroup} onGroupChange={setSelectedGroup}
          recipientCount={recipientCount} totalCost={totalCost}
          creating={creating} error={error} onCreate={handleCreateAndSend}
        />
      ) : (
        <HistoryPanel
          campaigns={campaigns} selectedCampaign={selectedCampaign} recipients={campaignRecipients}
          onSelect={handleViewCampaign} onDuplicate={handleDuplicate} onDelete={handleDelete}
          onCloseDetails={() => { setSelectedCampaign(null); setCampaignRecipients([]); }}
          formatDate={formatDate} statusColors={STATUS_COLORS}
        />
      )}
    </div>
  );
}
