import { Compass, Lock } from 'lucide-react';
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
  /** Client JWT — required to run /api/platform/* endpoints. */
  clientToken?: string;
  onExecute: () => void;
  onCopyCurl: () => void;
  onMediaUpload: (fieldKey: string) => void;
  onRecordAudio: () => void;
  onAddContact: () => void;
  onCloseResponse: () => void;
}

/** True when the endpoint path starts with /api/platform/ — those need JWT. */
function requiresJwt(ep: EndpointDef | null): boolean {
  return !!ep && ep.path.startsWith('/api/platform');
}

export default function SandboxBody(props: SandboxBodyProps) {
  if (!props.selectedEndpoint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1915] border border-[#2d2813] rounded-3xl text-center p-8 text-[#5a554a] space-y-3 shadow-sm">
        <Compass className="w-12 h-12 text-[#3d3a1e]" />
        <p className="font-bold text-[#cbd3cf] text-sm">Select an endpoint to test</p>
        <p className="text-xs text-[#a8a99e] max-w-xs">Choose an endpoint from the left panel, fill in the parameters, and execute a live request.</p>
      </div>
    );
  }

  const needsJwt = requiresJwt(props.selectedEndpoint);
  const hasJwt = Boolean(props.clientToken);

  return (
    <>
      {needsJwt && !hasJwt && (
        <div className="flex items-start gap-2 p-3 bg-amber-900/30 border border-amber-900/50 rounded-xl text-[11px] text-amber-200">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>JWT auth required.</strong> This <code className="font-mono">/api/platform/</code> endpoint
            needs the Bearer JWT from <code className="font-mono">fidscript login</code>. The Copy cURL button
            still works for pasting into a shell where you've already authenticated.
          </div>
        </div>
      )}

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
        /** Disable Execute when JWT is required but missing. */
        requireJwt={needsJwt}
        hasJwt={hasJwt}
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
