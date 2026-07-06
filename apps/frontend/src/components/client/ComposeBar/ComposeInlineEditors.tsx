import React from 'react';
import type { Instance } from '../../../services/api';
import MediaInlineEditor from '../MediaInlineEditor';
import LocationInlineEditor from '../LocationInlineEditor';
import ContactPickerPanel from '../ContactPickerPanel';
import PollInlineEditor from '../PollInlineEditor';
import ListInlineEditor from '../ListInlineEditor';

type AttachmentType = 'photo' | 'document' | 'location' | 'contact' | 'poll' | 'list';

interface Props {
  activeEditor: AttachmentType;
  selectedInstance: Instance;
  selectedContactName: string;
  savedContacts: import('../../../services/api').Contact[];
  onSend: (tokenCost?: number) => void;
  onCancel: () => void;
}

export function ComposeInlineEditors({
  activeEditor, selectedInstance, selectedContactName, savedContacts, onSend, onCancel,
}: Props) {
  const to = selectedContactName;
  const instance = selectedInstance;

  switch (activeEditor) {
    case 'photo':
    case 'document':
      return (
        <MediaInlineEditor instance={instance} to={to} onSend={onSend} onCancel={onCancel} />
      );
    case 'location':
      return (
        <LocationInlineEditor instance={instance} to={to} onSend={onSend} onCancel={onCancel} />
      );
    case 'contact':
      return (
        <ContactPickerPanel contacts={savedContacts} instance={instance} to={to} onSend={onSend} onCancel={onCancel} />
      );
    case 'poll':
      return (
        <PollInlineEditor instance={instance} to={to} onSend={onSend} onCancel={onCancel} />
      );
    case 'list':
      return (
        <ListInlineEditor instance={instance} to={to} onSend={onSend} onCancel={onCancel} />
      );
    default:
      return null;
  }
}
