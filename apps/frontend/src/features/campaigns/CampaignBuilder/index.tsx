import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Instance, Contact } from '../../../services/api';
import CampaignBuilderForm from './CampaignBuilderForm.js';
import { useCampaignBuilder } from './useCampaignBuilder.js';
import type { AudienceMode } from '../AudiencePicker.js';

interface CampaignBuilderProps {
  instances: Instance[];
  savedContacts: Contact[];
  onBack: () => void;
  onCreated: () => void;
}

export default function CampaignBuilder({ instances, savedContacts, onBack, onCreated }: CampaignBuilderProps) {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('paste');
  const [pastedPhones, setPastedPhones] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [segmentPhones, setSegmentPhones] = useState<string[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const builder = useCampaignBuilder(instances[0]?.name || '');

  const resolvedPhones = builder.type === 'broadcast'
    ? (audienceMode === 'paste'
      ? pastedPhones.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean)
      : audienceMode === 'contacts'
        ? savedContacts.filter(c => selectedContactIds.has(c.id)).map(c => c.phone)
        : segmentPhones)
    : [];

  const canSave = builder.name.trim() && builder.instanceName &&
    (builder.type === 'broadcast'
      ? resolvedPhones.length > 0 && (builder.messageType === 'text' ? builder.content.trim() : builder.mediaUrl.trim())
      : true);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813] rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-[#a8a99e]">New campaign</h3>
      </div>
      <CampaignBuilderForm
        {...builder}
        instances={instances}
        audienceMode={audienceMode} setAudienceMode={setAudienceMode}
        pastedPhones={pastedPhones} setPastedPhones={setPastedPhones}
        selectedContactIds={selectedContactIds} setSelectedContactIds={setSelectedContactIds}
        segmentPhones={segmentPhones} setSegmentPhones={setSegmentPhones}
        selectedSegmentId={selectedSegmentId} setSelectedSegmentId={setSelectedSegmentId}
        savedContacts={savedContacts}
        resolvedPhones={resolvedPhones}
        canSave={canSave}
        onSave={() => builder.create({ name: builder.name, instanceName: builder.instanceName, type: builder.type, messageType: builder.messageType, content: builder.content, mediaUrl: builder.mediaUrl, resolvedPhones }, false)}
        onLaunch={() => builder.create({ name: builder.name, instanceName: builder.instanceName, type: builder.type, messageType: builder.messageType, content: builder.content, mediaUrl: builder.mediaUrl, resolvedPhones }, true)}
        onCancel={onBack}
        onDone={onCreated}
      />
    </div>
  );
}
