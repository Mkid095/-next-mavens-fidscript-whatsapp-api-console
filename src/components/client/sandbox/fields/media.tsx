import { Mic, Upload, Loader2 } from 'lucide-react';
import { isMediaField } from '../../sandboxHelpers.js';

export function AudioField({
  fieldKey, bodyValues, onBodyValuesChange, placeholder, uploadingMedia, recordingAudio, onMediaUpload, onRecordAudio,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  placeholder?: string;
  uploadingMedia: boolean;
  recordingAudio: boolean;
  onMediaUpload: (fieldKey: string) => void;
  onRecordAudio: (fieldKey: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={bodyValues[fieldKey] || ''}
        onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
      />
      <button
        onClick={() => onRecordAudio(fieldKey)}
        disabled={uploadingMedia}
        className={`flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold border rounded-xl transition-colors shrink-0 disabled:opacity-50 ${
          recordingAudio ? 'bg-red-100 text-red-700 border-red-200' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
        }`}
      >
        {recordingAudio ? <><Mic className="w-3.5 h-3.5 animate-pulse" /> Recording…</> : <><Mic className="w-3.5 h-3.5" /> Record</>}
      </button>
      <button
        onClick={() => onMediaUpload(fieldKey)}
        disabled={uploadingMedia}
        className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shrink-0 disabled:opacity-50"
      >
        {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
      </button>
    </div>
  );
}

export function DefaultField({
  fieldKey, bodyValues, onBodyValuesChange, placeholder, uploadingMedia, onMediaUpload, fieldType,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  placeholder?: string;
  uploadingMedia: boolean;
  onMediaUpload: (fieldKey: string) => void;
  fieldType: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type={fieldType === 'number' ? 'number' : 'text'}
        value={bodyValues[fieldKey] || ''}
        onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
      />
      {isMediaField(fieldKey) && (
        <button
          onClick={() => onMediaUpload(fieldKey)}
          disabled={uploadingMedia}
          className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shrink-0 disabled:opacity-50"
        >
          {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
        </button>
      )}
    </div>
  );
}
