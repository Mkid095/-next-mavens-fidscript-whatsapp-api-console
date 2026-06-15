import { useState } from 'react';
import { ArrowLeft, Save, Send, Library } from 'lucide-react';
import { campaignsApi } from '../../services/api';
import type { Instance, Contact } from '../../services/api';
import AudiencePicker, { type AudienceMode } from './AudiencePicker.js';
import { MediaPicker } from '../media/index.js';
import type { MediaAsset } from '../../data/api/platform.js';

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
 * Phase 5 — broadcast campaign builder.
 * Slice A: name + instance + text/media content + save/launch
 * Slice B: media message can pull from the library
 * Slice C: audience source can be paste / contacts / segment
 * Future slices add: trigger/drip flows (D), status posts (E).
 */
export default function CampaignBuilder({ instances, savedContacts, onBack, onCreated }: CampaignBuilderProps) {
  const [name, setName] = useState('');
  const [instanceName, setInstanceName] = useState(instances[0]?.name || '');
  const [messageType, setMessageType] = useState<'text' | 'media'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('paste');
  const [pastedPhones, setPastedPhones] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [segmentPhones, setSegmentPhones] = useState<string[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedPhones = audienceMode === 'paste'
    ? pastedPhones.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean)
    : audienceMode === 'contacts'
      ? savedContacts.filter(c => selectedContactIds.has(c.id)).map(c => c.phone)
      : segmentPhones;

  const canSave = name.trim() && instanceName && resolvedPhones.length > 0 &&
    (messageType === 'text' ? content.trim() : mediaUrl.trim());

  const create = async (andLaunch: boolean) => {
    setError(null);
    setSaving(true);
    try {
      const res = await campaignsApi.create({
        name: name.trim(),
        instance_name: instanceName,
        message_type: messageType,
        content: content || undefined,
        media_url: mediaUrl || undefined,
        phone_numbers: resolvedPhones,
        type: 'broadcast',
        segment_id: selectedSegmentId || undefined,
      });
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to create campaign');
        return;
      }
      const id = (res.data as { id: string }).id;
      if (andLaunch) await campaignsApi.send(id);
      onCreated();
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
        <h3 className="text-sm font-bold text-forest-deep">New broadcast campaign</h3>
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

      <div>
        <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Message</label>
        <div className="flex items-center gap-1.5 mb-2">
          {MESSAGE_TYPES.map(t => (
            <button key={t.value} onClick={() => setMessageType(t.value as 'text' | 'media')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${messageType === t.value ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {messageType === 'text' ? (
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
            placeholder="Your message. {{name}} will be replaced per recipient."
            className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://… (or pick from library)"
                className="flex-1 px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500 font-mono" />
              <button type="button" onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 shrink-0">
                <Library className="w-3.5 h-3.5" /> From library
              </button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={2} placeholder="Optional caption"
              className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
          </div>
        )}
      </div>

      <AudiencePicker
        mode={audienceMode}
        setMode={setAudienceMode}
        pastedPhones={pastedPhones}
        setPastedPhones={setPastedPhones}
        selectedContactIds={selectedContactIds}
        setSelectedContactIds={setSelectedContactIds}
        savedContacts={savedContacts}
        selectedSegmentId={selectedSegmentId}
        onSegmentPicked={(id, phones) => {
          setSelectedSegmentId(id);
          setSegmentPhones(phones);
        }}
      />
      <p className="text-[10px] text-stone-400 -mt-3">{resolvedPhones.length} recipient{resolvedPhones.length === 1 ? '' : 's'}</p>

      {error && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {pickerOpen && (
        <MediaPicker
          kindFilter="image"
          onSelect={(a: MediaAsset) => { setMediaUrl(a.url); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-stone-100">
        <button onClick={() => create(false)} disabled={!canSave || saving}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-stone-200 text-stone-700 rounded-xl disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Save draft
        </button>
        <button onClick={() => create(true)} disabled={!canSave || saving}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-forest-deep text-white rounded-xl disabled:opacity-50">
          <Send className="w-3.5 h-3.5" /> {saving ? 'Launching…' : 'Save & launch'}
        </button>
      </div>
    </div>
  );
}
