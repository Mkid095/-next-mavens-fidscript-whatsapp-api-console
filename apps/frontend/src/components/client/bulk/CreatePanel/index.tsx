/**
 * CreatePanel — thin shell.
 * Owns all campaign creation state; delegates UI to sub-components.
 */
import React from 'react';
import CampaignForm from './CampaignForm';
import ContactPicker from './ContactPicker';
import MessageForm from './MessageForm';
import FooterSummary from './FooterSummary';
import type { Instance, Contact, ContactGroup } from '../../../services/api';

export interface CreatePanelProps {
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

export default function CreatePanel({
  campaignName, onCampaignNameChange,
  selectedInstance, onInstanceChange, instances,
  messageText, onMessageChange,
  selectedContacts, onToggleContact, savedContacts,
  phoneInput, onPhoneInputChange, extraPhones, onAddPhone, onRemovePhone,
  scheduledAt, onScheduledChange,
  groups, selectedGroup, onGroupChange,
  recipientCount, totalCost, creating, error, onCreate,
}: CreatePanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <CampaignForm
        campaignName={campaignName} onCampaignNameChange={onCampaignNameChange}
        selectedInstance={selectedInstance} onInstanceChange={onInstanceChange} instances={instances}
        selectedGroup={selectedGroup} onGroupChange={onGroupChange} groups={groups}
      />

      <ContactPicker
        savedContacts={savedContacts} selectedContacts={selectedContacts} onToggleContact={onToggleContact}
        phoneInput={phoneInput} onPhoneInputChange={onPhoneInputChange}
        onAddPhone={onAddPhone} extraPhones={extraPhones} onRemovePhone={onRemovePhone}
        selectedGroup={selectedGroup}
      />

      <MessageForm
        messageText={messageText} onMessageChange={onMessageChange}
        scheduledAt={scheduledAt} onScheduledChange={onScheduledChange} error={error}
      />

      <FooterSummary
        recipientCount={recipientCount} totalCost={totalCost} messageText={messageText}
        selectedInstance={selectedInstance} instances={instances}
        campaignName={campaignName} creating={creating} scheduledAt={scheduledAt} onCreate={onCreate}
      />
    </div>
  );
}
