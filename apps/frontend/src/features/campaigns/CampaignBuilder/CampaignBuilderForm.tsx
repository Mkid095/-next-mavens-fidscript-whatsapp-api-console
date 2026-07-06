import type { Instance, Contact } from '../../../services/api';
import AudiencePicker, { type AudienceMode } from '../AudiencePicker.js';
import CampaignTypeSelector, { type CampaignFormType } from '../CampaignTypeSelector.js';
import DripBuilderPanel from '../DripBuilderPanel.js';
import MessageBlock from '../MessageBlock.js';
import CampaignBuilderFooter from './CampaignBuilderFooter.js';

interface CampaignBuilderFormProps {
  name: string;
  setName: (v: string) => void;
  instanceName: string;
  setInstanceName: (v: string) => void;
  instances: Instance[];
  type: CampaignFormType;
  setType: (v: CampaignFormType) => void;
  messageType: 'text' | 'media';
  setMessageType: (v: 'text' | 'media') => void;
  content: string;
  setContent: (v: string) => void;
  mediaUrl: string;
  setMediaUrl: (v: string) => void;
  audienceMode: AudienceMode;
  setAudienceMode: (v: AudienceMode) => void;
  pastedPhones: string;
  setPastedPhones: (v: string) => void;
  selectedContactIds: Set<string>;
  setSelectedContactIds: (v: Set<string>) => void;
  segmentPhones: string[];
  setSegmentPhones: (v: string[]) => void;
  selectedSegmentId: string | null;
  setSelectedSegmentId: (v: string | null) => void;
  savedContacts: Contact[];
  resolvedPhones: string[];
  canSave: boolean;
  error: string | null;
  saving: boolean;
  createdId: string | null;
  onSave: () => void;
  onLaunch: () => void;
  onCancel: () => void;
  onDone: () => void;
}

export default function CampaignBuilderForm({
  name, setName,
  instanceName, setInstanceName, instances,
  type, setType,
  messageType, setMessageType,
  content, setContent,
  mediaUrl, setMediaUrl,
  audienceMode, setAudienceMode,
  pastedPhones, setPastedPhones,
  selectedContactIds, setSelectedContactIds,
  segmentPhones, setSegmentPhones,
  selectedSegmentId, setSelectedSegmentId,
  savedContacts,
  resolvedPhones,
  canSave,
  error,
  saving,
  createdId,
  onSave, onLaunch, onCancel, onDone,
}: CampaignBuilderFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Campaign name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black Friday promo"
            className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] placeholder:text-[#5a554a] focus:outline-none focus:border-[#eab308]" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Send from</label>
          <select value={instanceName} onChange={e => setInstanceName(e.target.value)}
            className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308]">
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
            messageType={messageType} setMessageType={setMessageType}
            content={content} setContent={setContent}
            mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
          />
          <AudiencePicker
            mode={audienceMode} setMode={setAudienceMode}
            pastedPhones={pastedPhones} setPastedPhones={setPastedPhones}
            selectedContactIds={selectedContactIds} setSelectedContactIds={setSelectedContactIds}
            savedContacts={savedContacts}
            selectedSegmentId={selectedSegmentId}
            onSegmentPicked={(id, phones) => { setSelectedSegmentId(id); setSegmentPhones(phones); }}
          />
          <p className="text-[10px] text-[#6e684a] -mt-3">{resolvedPhones.length} recipient{resolvedPhones.length === 1 ? '' : 's'}</p>
        </>
      )}

      {(type === 'drip' || type === 'trigger') && (
        <DripBuilderPanel campaignId={createdId} instances={instances} />
      )}

      {error && <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2">{error}</p>}

      <CampaignBuilderFooter
        canSave={canSave} saving={saving} createdId={createdId} type={type}
        onSave={onSave} onLaunch={onLaunch} onCancel={onCancel} onDone={onDone} onCreated={onDone}
      />
    </>
  );
}
