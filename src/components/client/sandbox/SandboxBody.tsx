import { Compass } from 'lucide-react';
import type { EndpointDef, SandboxContact, SandboxContactItem } from './types.js';
import SandboxRequestBuilder from './SandboxRequestBuilder.js';
import SandboxResponse from './SandboxResponse.js';

export interface SandboxBodyProps {
  selectedEndpoint: EndpointDef | null;
  instanceName: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  contactItems: SandboxContactItem[];
  onContactItemsChange: (next: SandboxContactItem[]) => void;
  pollOptions: string[];
  onPollOptionsChange: (next: string[]) => void;
  contacts: SandboxContact[];
  uploadingMedia: boolean;
  recordingAudio: boolean;
  loading: boolean;
  copied: boolean;
  response: string | null;
  responseStatus: number | null;
  onExecute: () => void;
  onCopyCurl: () => void;
  onMediaUpload: (fieldKey: string) => void;
  onRecordAudio: () => void;
  onAddContact: () => void;
  onCloseResponse: () => void;
}

export default function SandboxBody(props: SandboxBodyProps) {
  if (!props.selectedEndpoint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white border border-[#eaebe4] rounded-3xl text-center p-8 text-stone-400 space-y-3 shadow-sm">
        <Compass className="w-12 h-12 text-yellow-200" />
        <p className="font-bold text-forest-deep text-sm">Select an endpoint to test</p>
        <p className="text-xs text-graphite max-w-xs">Choose an endpoint from the left panel, fill in the parameters, and execute a live request.</p>
      </div>
    );
  }

  return (
    <>
      <SandboxRequestBuilder
        endpoint={props.selectedEndpoint}
        instanceName={props.instanceName}
        bodyValues={props.bodyValues}
        onBodyValuesChange={props.onBodyValuesChange}
        contactItems={props.contactItems}
        onContactItemsChange={props.onContactItemsChange}
        pollOptions={props.pollOptions}
        onPollOptionsChange={props.onPollOptionsChange}
        contacts={props.contacts}
        uploadingMedia={props.uploadingMedia}
        recordingAudio={props.recordingAudio}
        loading={props.loading}
        copied={props.copied}
        onExecute={props.onExecute}
        onCopyCurl={props.onCopyCurl}
        onMediaUpload={props.onMediaUpload}
        onRecordAudio={props.onRecordAudio}
        onAddContact={props.onAddContact}
      />
      {props.response !== null && (
        <SandboxResponse
          response={props.response}
          status={props.responseStatus}
          onClose={props.onCloseResponse}
        />
      )}
    </>
  );
}
