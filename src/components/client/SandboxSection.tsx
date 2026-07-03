import React, { useState } from 'react';
import type { Instance } from '../../services/api';
import type { EndpointDef } from './sandbox/types.js';
import { useAudioRecorder } from './sandbox/useAudioRecorder.js';
import { useSandboxData } from './sandbox/useSandboxData.js';
import { useSandboxActions } from './sandbox/useSandboxActions.js';
import SandboxSelectorBar from './sandbox/SandboxSelectorBar.js';
import SandboxEndpointList from './sandbox/SandboxEndpointList.js';
import SandboxBody from './sandbox/SandboxBody.js';
import AddContactModal from './sandbox/AddContactModal.js';

interface SandboxSectionProps {
  clientToken?: string;
  instances: Instance[];
  tokenBalance: number;
  onTokenDeduct: (n: number) => void;
}

export default function SandboxSection({ clientToken, instances, tokenBalance, onTokenDeduct }: SandboxSectionProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Messaging']));
  const [search, setSearch] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const { apiKeys, contacts, setContacts, instanceName, setInstanceName, selectedKeyId, setSelectedKeyId } = useSandboxData({ clientToken, instances });

  const {
    bodyValues, setBodyValues,
    pollOptions, setPollOptions,
    contactItems, setContactItems,
    response, responseStatus, loading,
    uploadingMedia, copied,
    selectEndpoint, copyCurl, uploadMedia, execute, addContact, closeResponse,
  } = useSandboxActions({
    clientToken, onTokenDeduct,
    onContactsAdded: newOnes => setContacts(prev => [...prev, ...newOnes]),
  });

  const audio = useAudioRecorder({
    clientToken,
    onUploaded: url => setBodyValues(prev => ({ ...prev, audio: url, media_type: 'audio' })),
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    selectEndpoint(ep);
  };

  const handleAddTestContact = async () => {
    await addContact(newContactName, newContactPhone);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleExecute = () => {
    if (!selectedEndpoint) return;
    void execute({ endpoint: selectedEndpoint, instanceName, selectedKeyId });
  };

  const handleCopyCurl = () => {
    if (!selectedEndpoint) return;
    copyCurl(selectedEndpoint, instanceName);
  };

  return (
    <div className="space-y-4">
      <SandboxSelectorBar
        instances={instances}
        instanceName={instanceName}
        onInstanceName={setInstanceName}
        apiKeys={apiKeys}
        selectedKeyId={selectedKeyId}
        onSelectedKeyId={setSelectedKeyId}
        tokenBalance={tokenBalance}
      />

      <div className="grid gap-4 min-w-0" style={{ gridTemplateColumns: '340px minmax(0, 1fr)', minHeight: '600px', height: 'calc(100vh - 240px)' }}>
        <SandboxEndpointList
          search={search}
          onSearch={setSearch}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={handleSelectEndpoint}
          instanceName={instanceName}
        />

        <div className="flex flex-col gap-4 min-w-0 overflow-y-auto">
          <SandboxBody
            selectedEndpoint={selectedEndpoint}
            instanceName={instanceName}
            bodyValues={bodyValues}
            onBodyValuesChange={setBodyValues}
            contactItems={contactItems}
            onContactItemsChange={setContactItems}
            pollOptions={pollOptions}
            onPollOptionsChange={setPollOptions}
            contacts={contacts}
            uploadingMedia={uploadingMedia || audio.uploading}
            recordingAudio={audio.recording}
            loading={loading}
            copied={copied}
            response={response}
            responseStatus={responseStatus}
            clientToken={clientToken}
            onExecute={handleExecute}
            onCopyCurl={handleCopyCurl}
            onMediaUpload={uploadMedia}
            onRecordAudio={() => audio.toggle()}
            onAddContact={() => setShowAddContact(true)}
            onCloseResponse={closeResponse}
          />
        </div>
      </div>

      <AddContactModal
        open={showAddContact}
        name={newContactName}
        phone={newContactPhone}
        onName={setNewContactName}
        onPhone={setNewContactPhone}
        onClose={() => setShowAddContact(false)}
        onSave={handleAddTestContact}
      />
    </div>
  );
}
