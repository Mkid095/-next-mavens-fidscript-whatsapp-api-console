import { useState, useEffect } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { campaignsApi, groupsApi } from '../../../services/api';
import type { Instance, Contact, ContactGroup } from '../../../services/api';
import ContactPicker from './ContactPicker.js';
import BulkMessagingFormHeader from './BulkMessagingFormHeader.js';
import BulkMessagingFormFooter from './BulkMessagingFormFooter.js';
import GroupSelector from './GroupSelector.js';

interface BulkMessagingFormProps {
  instances: Instance[];
  savedContacts: Contact[];
  onTokenDeduct?: (n: number) => void;
}

export default function BulkMessagingForm({ instances, savedContacts, onTokenDeduct }: BulkMessagingFormProps) {
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
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    groupsApi.getAll().then(res => { if (res.success && res.data) setGroups(res.data); });
  }, []);

  const toggleContact = (phone: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
      return next;
    });
  };

  const addPhone = () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (phone && ![...selectedContacts, ...extraPhones].includes(phone)) {
      setExtraPhones(prev => [...prev, phone]);
      setPhoneInput('');
    }
  };

  const allPhones = [
    ...Array.from(selectedContacts),
    ...extraPhones.map(p => p.replace(/\D/g, '')).filter(Boolean),
  ];

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
        } else { setError(sendRes.error || 'Failed to start campaign'); }
      } else { setError(res.error || 'Failed to create campaign'); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setCreating(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <BulkMessagingFormHeader
        campaignName={campaignName} onCampaignNameChange={setCampaignName}
        selectedInstance={selectedInstance} onInstanceChange={setSelectedInstance} instances={instances}
      />

      <GroupSelector
        selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} groups={groups}
      />

      {!selectedGroup && (
        <ContactPicker
          selectedContacts={selectedContacts} onToggleContact={toggleContact} savedContacts={savedContacts}
          phoneInput={phoneInput} onPhoneInputChange={setPhoneInput}
          extraPhones={extraPhones} onAddPhone={addPhone}
          onRemovePhone={p => setExtraPhones(prev => prev.filter(x => x !== p))}
        />
      )}

      <div>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1">Message</label>
        <textarea
          value={messageText} onChange={e => setMessageText(e.target.value)} rows={4}
          placeholder="Type your message. {{name}} is replaced per recipient."
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] placeholder:text-[#5a554a] focus:outline-none focus:border-[#eab308]"
        />
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-[#6e684a]">
            {messageText.length} chars
            {messageText.length > 1600 ? ' (3 SMS segments)' : messageText.length > 400 ? ' (2 SMS segments)' : ''}
          </p>
          <p className="text-[10px] text-[#6e684a]">
            ≈ {(messageText.length > 1600 ? 3 : messageText.length > 400 ? 2 : 1)} token/recipient
          </p>
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Schedule (optional)
        </label>
        <input
          type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
          min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
        />
      </div>

      {error && (
        <p className="text-[10px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      <BulkMessagingFormFooter
        recipientCount={recipientCount} totalCost={totalCost}
        messageLength={messageText.length} creating={creating}
        scheduledAt={scheduledAt} selectedInstance={selectedInstance}
        instances={instances} onCreate={handleCreateAndSend}
        disabled={!campaignName.trim() || !selectedInstance || recipientCount === 0 || !messageText.trim()}
      />
    </div>
  );
}
