import { useState } from 'react';
import { Library } from 'lucide-react';
import { MediaPicker } from '../media/index.js';
import type { MediaAsset } from '../../data/api/platform.js';

interface MessageBlockProps {
  messageType: 'text' | 'media';
  setMessageType: (t: 'text' | 'media') => void;
  content: string;
  setContent: (s: string) => void;
  mediaUrl: string;
  setMediaUrl: (s: string) => void;
}

const MESSAGE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'media', label: 'Image / Media' },
];

/**
 * Phase 5 Slice A — broadcast message block. Text or media (URL or library
 * picker). Used inside CampaignBuilder's broadcast tab.
 */
export default function MessageBlock({ messageType, setMessageType, content, setContent, mediaUrl, setMediaUrl }: MessageBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Message</label>
      <div className="flex items-center gap-1.5 mb-2">
        {MESSAGE_TYPES.map(t => (
          <button key={t.value} onClick={() => setMessageType(t.value as 'text' | 'media')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${messageType === t.value ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {messageType === 'text' ? (
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
          placeholder="Your message. {{name}} will be replaced per recipient."
          className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://… (or pick from library)"
              className="flex-1 px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500 font-mono" />
            <button type="button" onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 shrink-0">
              <Library className="w-3.5 h-3.5" /> From library
            </button>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={2} placeholder="Optional caption"
            className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500" />
        </div>
      )}
      {pickerOpen && (
        <MediaPicker
          kindFilter="image"
          onSelect={(a: MediaAsset) => { setMediaUrl(a.url); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
