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
  onExecute,
  onCopyCurl,
  onMediaUpload,
  onRecordAudio,
  onAddContact,
}: SandboxRequestBuilderProps) {
  const path = endpoint.path.replace(':instanceName', instanceName || ':instance');
  const canExecute = Boolean(instanceName) && !loading;

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[endpoint.method]}`}>{endpoint.method}</span>
            <code className="text-xs font-mono font-bold text-forest-deep">{path}</code>
          </div>
          <p className="text-xs text-graphite">{endpoint.desc}</p>
        </div>
        {endpoint.cost !== undefined && endpoint.cost > 0 && (
          <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 shrink-0">
            {endpoint.cost} token{endpoint.cost > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {endpoint.path.includes('/reaction/') && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-800">
          <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p><strong>Tip:</strong> You need a <strong>messageId</strong> to react to. First send a message using <strong>Send Text</strong>, then use the returned <code>messageId</code> here.</p>
        </div>
      )}

      {endpoint.bodyFields && endpoint.bodyFields.length > 0 && (
        <div className="grid gap-3">
          {endpoint.bodyFields.map(field => (
            <div key={field.key}>
              <label className="block text-[10px] font-bold text-stone-600 mb-1">
                {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
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
          className="flex items-center gap-2 px-4 py-2 bg-forest-deep hover:bg-[#33301a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Executing…' : 'Execute Request'}
        </button>
        <button
          onClick={onCopyCurl}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#eaebe4] hover:border-yellow-300 text-stone-600 text-xs font-bold rounded-xl transition-colors"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy cURL</>}
        </button>
      </div>
    </div>
  );
}
