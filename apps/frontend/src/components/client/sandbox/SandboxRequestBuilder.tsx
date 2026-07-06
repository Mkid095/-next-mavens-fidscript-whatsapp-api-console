import { Play, Copy, Check, MessageCircle } from 'lucide-react';
import { METHOD_COLORS } from '../sandboxHelpers.js';
import type { EndpointDef } from './types.js';
import SandboxFieldRow from './SandboxFieldRow.js';
import type { SandboxContact, SandboxContactItem } from './types.js';

export interface SandboxRequestBuilderProps {
  endpoint: EndpointDef;
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
  /** When true, Execute is disabled until JWT is set. */
  requireJwt?: boolean;
  hasJwt?: boolean;
  onExecute: () => void;
  onCopyCurl: () => void;
  onMediaUpload: (fieldKey: string) => void;
  onRecordAudio: (fieldKey: string) => void;
  onAddContact: () => void;
}

export default function SandboxRequestBuilder({
  endpoint,
  instanceName,
  bodyValues,
  onBodyValuesChange,
  contactItems,
  onContactItemsChange,
  pollOptions,
  onPollOptionsChange,
  contacts,
  uploadingMedia,
  recordingAudio,
  loading,
  copied,
  requireJwt = false,
  hasJwt = false,
  onExecute,
  onCopyCurl,
  onMediaUpload,
  onRecordAudio,
  onAddContact,
}: SandboxRequestBuilderProps) {
  const path = endpoint.path.replace(':instanceName', instanceName || ':instance');
  const canExecute = Boolean(instanceName) && !loading && (!requireJwt || hasJwt);

  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[endpoint.method]}`}>{endpoint.method}</span>
            <code className="text-xs font-mono font-bold text-[#cbd3cf] break-all">{path}</code>
          </div>
          <p className="text-xs text-[#6e684a]">{endpoint.desc}</p>
        </div>
        {endpoint.cost !== undefined && endpoint.cost > 0 && (
          <span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/40 px-2 py-0.5 rounded-full border border-yellow-900/50 shrink-0">
            {endpoint.cost} token{endpoint.cost > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {endpoint.path.includes('/reaction/') && (
        <div className="flex items-start gap-2 p-3 bg-blue-900/30 border border-blue-900/50 rounded-xl text-[10px] text-blue-300">
          <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p><strong>Tip:</strong> You need a <strong>messageId</strong> to react to. First send a message using <strong>Send Text</strong>, then use the returned <code>messageId</code> here.</p>
        </div>
      )}

      {endpoint.bodyFields && endpoint.bodyFields.length > 0 && (
        <div className="grid gap-3">
          {endpoint.bodyFields.map(field => (
            <div key={field.key}>
              <label className="block text-[10px] font-bold text-[#6e684a] mb-1">
                {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <SandboxFieldRow
                field={field}
                endpoint={endpoint}
                bodyValues={bodyValues}
                onBodyValuesChange={onBodyValuesChange}
                contactItems={contactItems}
                onContactItemsChange={onContactItemsChange}
                pollOptions={pollOptions}
                onPollOptionsChange={onPollOptionsChange}
                contacts={contacts}
                uploadingMedia={uploadingMedia}
                onMediaUpload={onMediaUpload}
                onRecordAudio={onRecordAudio}
                onAddContact={onAddContact}
                recordingAudio={recordingAudio}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onExecute}
          disabled={!canExecute}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#181711] text-xs font-bold rounded-xl transition-colors"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Executing…' : (requireJwt && !hasJwt ? 'JWT required — run fidscript login' : 'Execute Request')}
        </button>
        <button
          onClick={onCopyCurl}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#2d2813] hover:border-yellow-500 text-[#a8a99e] hover:text-[#cbd3cf] text-xs font-bold rounded-xl transition-colors"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy cURL</>}
        </button>
      </div>
    </div>
  );
}
