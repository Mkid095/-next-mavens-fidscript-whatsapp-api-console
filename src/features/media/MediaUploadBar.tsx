import { useRef, useState } from 'react';
import { Search, Upload, X } from 'lucide-react';
import type { MediaKind } from '../../data/api/platform.js';

const KIND_LABELS: { value: '' | MediaKind; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
];

interface MediaUploadBarProps {
  kind: '' | MediaKind;
  setKind: (k: '' | MediaKind) => void;
  tag: string;
  setTag: (t: string) => void;
  allTags: string[];
  q: string;
  setQ: (s: string) => void;
  uploading: boolean;
  onFile: (file: File) => void;
  onPasteUrl: (url: string, name: string) => void;
}

/**
 * Toolbar above the media grid: kind filter, tag filter, search, upload
 * (file picker) and From-URL (paste a public URL). Pure presentational —
 * MediaLibrary owns the upload handler.
 */
export default function MediaUploadBar({
  kind, setKind, tag, setTag, allTags, q, setQ, uploading, onFile, onPasteUrl,
}: MediaUploadBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [pastedName, setPastedName] = useState('');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {KIND_LABELS.map(k => (
            <button key={k.value || 'all'} onClick={() => setKind(k.value)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${kind === k.value ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
              {k.label}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <select value={tag} onChange={e => setTag(e.target.value)}
            className="px-2 py-1 text-[10px] border border-[#2d2813] bg-[#1a1915] text-[#a8a99e] rounded-lg">
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <div className="flex-1 min-w-[140px] relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#6e684a]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or tag…"
            className="w-full pl-7 pr-2 py-1 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg placeholder:text-[#5a554a]" />
        </div>
        <button onClick={() => setShowPaste(v => !v)}
          className="px-2.5 py-1 text-[10px] font-bold bg-[#1a1915] border border-[#2d2813] text-[#6e684a] rounded-lg hover:border-[#3d3a1e]">
          From URL
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg disabled:opacity-50">
          <Upload className="w-3 h-3" /> {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      </div>

      {showPaste && (
        <div className="p-3 bg-[#181711] border border-[#2d2813] rounded-xl flex items-center gap-2">
          <input value={pastedUrl} onChange={e => setPastedUrl(e.target.value)} placeholder="https://…"
            className="flex-1 px-2 py-1.5 text-xs border border-[#2d2813] bg-[#1a1915] text-[#a8a99e] rounded-lg font-mono placeholder:text-[#5a554a]" />
          <input value={pastedName} onChange={e => setPastedName(e.target.value)} placeholder="Name"
            className="w-32 px-2 py-1.5 text-xs border border-[#2d2813] bg-[#1a1915] text-[#a8a99e] rounded-lg placeholder:text-[#5a554a]" />
          <button onClick={() => {
            if (!pastedUrl.trim()) return;
            onPasteUrl(pastedUrl.trim(), pastedName.trim());
            setPastedUrl(''); setPastedName(''); setShowPaste(false);
          }} disabled={!pastedUrl.trim() || uploading}
            className="px-3 py-1.5 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg disabled:opacity-50">Add</button>
          <button onClick={() => setShowPaste(false)} className="p-1 text-[#6e684a] hover:text-[#a8a99e]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
