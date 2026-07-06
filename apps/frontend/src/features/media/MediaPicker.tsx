import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useMediaAssets } from '../../data/hooks/useMediaAssets.js';
import type { MediaAsset } from '../../data/api/platform.js';
import MediaCard from './MediaCard.js';
import MediaUploadBar from './MediaUploadBar.js';

interface MediaPickerProps {
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
  currentAssetId?: string;
  kindFilter?: 'image' | 'video' | 'audio' | 'document';
}

/**
 * Modal that lets a caller pick one media asset from the library (or upload
 * a new one inline). Used by CampaignBuilder for the media-message body
 * and anywhere else we want a "select from library" affordance.
 */
export default function MediaPicker({ onSelect, onClose, currentAssetId, kindFilter }: MediaPickerProps) {
  const { assets, kind, setKind, tag, setTag, allTags, q, setQ, loading, upload } = useMediaAssets({ kind: kindFilter });
  const [selectedId, setSelectedId] = useState<string | null>(currentAssetId || null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await upload({ image: dataUrl, name: file.name });
      if (res.success && res.data) setSelectedId(res.data.id);
    } finally { setUploading(false); }
  };

  const handlePasteUrl = async (url: string, name: string) => {
    setUploading(true);
    try {
      const res = await upload({ url, name: name || 'From URL' });
      if (res.success && res.data) setSelectedId(res.data.id);
    } finally { setUploading(false); }
  };

  const selected = assets.find(a => a.id === selectedId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-forest-deep">Choose from media library</h3>
            <p className="text-[10px] text-stone-500">Pick an existing asset, upload a new file, or paste a URL.</p>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-stone-100">
          <MediaUploadBar
            kind={kind} setKind={setKind} tag={tag} setTag={setTag} allTags={allTags}
            q={q} setQ={setQ} uploading={uploading}
            onFile={handleFile} onPasteUrl={handlePasteUrl}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && assets.length === 0 && <p className="text-xs text-stone-400">Loading…</p>}
          {assets.length === 0 && !loading && <p className="text-xs text-stone-500 text-center py-12">No media yet. Upload or paste a URL to add one.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {assets.map(a => (
              <MediaCard key={a.id} asset={a} selected={a.id === selectedId} onClick={() => setSelectedId(a.id)} />
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-stone-100 flex items-center justify-between">
          <p className="text-[11px] text-stone-500 truncate">
            {selected ? `Selected: ${selected.name}` : 'Nothing selected'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-bold bg-white border border-stone-200 text-stone-700 rounded-xl">Cancel</button>
            <button onClick={() => selected && onSelect(selected)} disabled={!selected}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-forest-deep text-white rounded-xl disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> Use this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
