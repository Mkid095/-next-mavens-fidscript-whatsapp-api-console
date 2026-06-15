import { isLocationField, isContactField, isPollOptions, isStatusType } from '../sandboxHelpers.js';
import type { EndpointDef, SandboxField, SandboxContact, SandboxContactItem } from './types.js';
import { ContactArrayField, ContactPickerField } from './fields/contact.js';
import { LocationField } from './fields/location.js';
import { StatusTypeField, PollOptionsField, EmojiField, EnumField } from './fields/choice.js';
import { AudioField, DefaultField } from './fields/media.js';
import { BooleanField, TextareaField } from './fields/primitives.js';

interface BaseProps {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  placeholder?: string;
}

export interface SandboxFieldRowProps {
  field: SandboxField;
  endpoint: EndpointDef;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  contactItems: SandboxContactItem[];
  onContactItemsChange: (next: SandboxContactItem[]) => void;
  pollOptions: string[];
  onPollOptionsChange: (next: string[]) => void;
  contacts: SandboxContact[];
  uploadingMedia: boolean;
  onMediaUpload: (fieldKey: string) => void;
  onRecordAudio: (fieldKey: string) => void;
  onAddContact: () => void;
  recordingAudio: boolean;
}

export default function SandboxFieldRow(props: SandboxFieldRowProps) {
  const { field, endpoint } = props;
  const { key, type, placeholder, enum: enumVals, fields: subFields } = field;
  const base: BaseProps = { fieldKey: key, bodyValues: props.bodyValues, onBodyValuesChange: props.onBodyValuesChange, placeholder };

  if (type === 'array' && subFields && subFields.length > 0) {
    return (
      <ContactArrayField
        subFields={subFields}
        contactItems={props.contactItems}
        onContactItemsChange={props.onContactItemsChange}
        contacts={props.contacts}
      />
    );
  }

  if (isContactField(key) && key.toLowerCase().includes('contact')) {
    return <ContactPickerField {...base} contacts={props.contacts} onAddContact={props.onAddContact} />;
  }

  if (isLocationField(key)) {
    return <LocationField {...base} />;
  }

  if (isStatusType(key)(endpoint) && enumVals) {
    return <StatusTypeField {...base} enumVals={enumVals} />;
  }

  if (isPollOptions(key) && endpoint.path.includes('/poll/')) {
    return <PollOptionsField pollOptions={props.pollOptions} onPollOptionsChange={props.onPollOptionsChange} />;
  }

  if (key.toLowerCase().includes('reaction') || key.toLowerCase().includes('emoji')) {
    return <EmojiField {...base} />;
  }

  if (enumVals && enumVals.length > 0) {
    return <EnumField {...base} enumVals={enumVals} />;
  }

  if (type === 'boolean') {
    return <BooleanField {...base} />;
  }

  if (type === 'text') {
    return <TextareaField {...base} />;
  }

  if (key.toLowerCase().includes('audio') || key.toLowerCase().includes('media')) {
    return (
      <AudioField
        {...base}
        uploadingMedia={props.uploadingMedia}
        recordingAudio={props.recordingAudio}
        onMediaUpload={props.onMediaUpload}
        onRecordAudio={props.onRecordAudio}
      />
    );
  }

  return <DefaultField {...base} uploadingMedia={props.uploadingMedia} onMediaUpload={props.onMediaUpload} fieldType={type} />;
}
