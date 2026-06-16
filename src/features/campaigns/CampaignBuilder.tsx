import { useState } from 'react';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { campaignsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';
import AudiencePicker, { type AudienceMode } from './AudiencePicker.js';
import CampaignTypeSelector, { type CampaignFormType } from './CampaignTypeSelector.js';
import DripBuilderPanel from './DripBuilderPanel.js';
import MessageBlock from './MessageBlock.js';

interface CampaignBuilderProps {
  clientToken?: string;
  instances: Instance[];
  savedContacts: Contact[];
  onBack: () => void;
  onCreated: () => void;
}

const MESSAGE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'media', label: 'Image / Media' },
];

/**
 * Phase 5 — campaign builder for all campaign types.
 * Slice A: broadcast (text/media content + audience + save/launch)
 * Slice B: media message can pull from the library
 * Slice C: audience source can be paste / contacts / segment
 * Slice D: type=drip|trigger swaps the lower half for DripBuilderPanel (flow + triggers + enrollments)
 * Slice E (future): type=status for posting to the WhatsApp status feed.
 */
export default function CampaignBuilder({ instances, savedContacts, onBack, onCreated }: CampaignBuilderProps) {
  const [name, setName] = useState('');
  const [instanceName, setInstanceName] = useState(instances[0]?.name || '');
  const [type, setType] = useState<CampaignFormType>('broadcast');
  const [messageType, setMessageType] = useState<'text' | 'media'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('paste');
  const [pastedPhones, setPastedPhones] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [segmentPhones, setSegmentPhones] = useState<string[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const resolvedPhones = type === 'broadcast'
    ? (audienceMode === 'paste'
      ? pastedPhones.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean)
      : audienceMode === 'contacts'
        ? savedContacts.filter(c => selectedContactIds.has(c.id)).map(c => c.phone)
        : segmentPhones)
    : [];

  const canSave = name.trim() && instanceName &&
    (type === 'broadcast'
      ? resolvedPhones.length > 0 && (messageType === 'text' ? content.trim() : mediaUrl.trim())
      : type === 'drip'
        ? true   // drip needs only name+instance; steps added after save
        : true); // trigger type: just name+instance for now

  const create = async (andLaunch: boolean) => {
    setError(null);
    setSaving(true);
    try {
      const res = await campaignsApi.create({
        name: name.trim(),
        instance_name: instanceName,
        message_type: type === 'broadcast' ? messageType : 'text',
        content: type === 'broadcast' ? content || undefined : undefined,
        media_url: type === 'broadcast' ? mediaUrl || undefined : undefined,
        phone_numbers: type === 'broadcast' ? resolvedPhones : [],
      });
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to create campaign');
        return;
      }
      const id = (res.data as { id: string }).id;
      setCreatedId(id);
      if (andLaunch && type === 'broadcast') await campaignsApi.send(id);
      // For drip/trigger, "launch" is implicit (triggers fire on events, drips tick on schedule)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 text-stone-500 hover:text-forest-deep hover:bg-stone-100 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-forest-deep">New campaign</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Campaign name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black Friday promo"
            className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Send from</label>
          <select value={instanceName} onChange={e => setInstanceName(e.target.value)}
            className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500">
            <option value="">— select instance —</option>
            {instances.map(i => (
              <option key={i.id} value={i.name}>
                {i.display_name || i.name} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      <CampaignTypeSelector value={type} onChange={setType} />

      {type === 'broadcast' && (
        <>
          <MessageBlock
            messageType={messageType}
            setMessageType={setMessageType}
            content={content}
            setContent={setContent}
            mediaUrl={mediaUrl}
            setMediaUrl={setMediaUrl}
          />

          <AudiencePicker
            mode={audienceMode}
            setMode={setAudienceMode}
            pastedPhones={pastedPhones}
            setPastedPhones={setPastedPhones}
            selectedContactIds={selectedContactIds}
            setSelectedContactIds={setSelectedContactIds}
            savedContacts={savedContacts}
            selectedSegmentId={selectedSegmentId}
            onSegmentPicked={(id, phones) => { setSelectedSegmentId(id); setSegmentPhones(phones); }}
          />
          <p className="text-[10px] text-stone-400 -mt-3">{resolvedPhones.length} recipient{resolvedPhones.length === 1 ? '' : 's'}</p>
        </>
      )}

      {(type === 'drip' || type === 'trigger') && (
        <DripBuilderPanel campaignId={createdId} instances={instances} />
      )}

      {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-stone-100">
        <button onClick={onBack} className="px-3 py-2 text-xs font-bold bg-white border border-stone-200 text-stone-700 rounded-xl">Cancel</button>
        {!createdId ? (
          <>
            <button onClick={() => create(false)} disabled={!canSave || saving}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-stone-200 text-stone-700 rounded-xl disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Save draft
            </button>
            {type === 'broadcast' && (
              <button onClick={() => create(true)} disabled={!canSave || saving}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-forest-deep text-white rounded-xl disabled:opacity-50">
                <Send className="w-3.5 h-3.5" /> {saving ? 'Launching…' : 'Save & launch'}
              </button>
            )}
          </>
        ) : (
          <button onClick={onCreated} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-forest-deep text-white rounded-xl">
            Done
          </button>
        )}
      </div>
    </div>
  );
}
