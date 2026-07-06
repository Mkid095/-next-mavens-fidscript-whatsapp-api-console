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

export default function MessageBlock({ messageType, setMessageType, content, setContent, mediaUrl, setMediaUrl }: MessageBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Message</label>
      <div className="flex items-center gap-1.5 mb-2">
        {MESSAGE_TYPES.map(t => (
          <button key={t.value} onClick={() => setMessageType(t.value as 'text' | 'media')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${messageType === t.value ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {messageType === 'text' ? (
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
          placeholder="Your message. {{name}} will be replaced per recipient."
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308] placeholder:text-[#5a554a]" />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://… (or pick from library)"
              className="flex-1 px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308] font-mono placeholder:text-[#5a554a]" />
            <button type="button" onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold bg-[#1a1915] border border-[#2d2813] text-[#6e684a] rounded-xl hover:border-[#3d3a1e] shrink-0">
              <Library className="w-3.5 h-3.5" /> From library
            </button>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={2} placeholder="Optional caption"
            className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308] placeholder:text-[#5a554a]" />
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
