import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useMediaAssets } from '../../data/hooks/useMediaAssets.js';
import MediaCard from './MediaCard.js';
import MediaUploadBar from './MediaUploadBar.js';

/**
 * Phase 5 Slice B — workspace-scoped media library. Thin shell that wires
 * the hook to MediaUploadBar (filters + upload) and MediaCard grid.
 * Consumed by MarketingCenter as the "Library" tab.
 */
export default function MediaLibrary() {
  const { assets, kind, setKind, tag, setTag, q, setQ, allTags, loading, error, upload, remove } = useMediaAssets();
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
      await upload({ image: dataUrl, name: file.name });
    } finally { setUploading(false); }
  };

  const handlePasteUrl = async (url: string, name: string) => {
    setUploading(true);
    try { await upload({ url, name: name || 'From URL' }); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-4">
      <MediaUploadBar
        kind={kind} setKind={setKind} tag={tag} setTag={setTag} allTags={allTags}
        q={q} setQ={setQ} uploading={uploading}
        onFile={handleFile} onPasteUrl={handlePasteUrl}
      />

      {error && <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2">{error}</p>}
      {loading && assets.length === 0 && <p className="text-xs text-[#6e684a]">Loading media…</p>}

      {assets.length === 0 && !loading ? (
        <div className="p-8 border-2 border-dashed border-[#2d2813] rounded-2xl text-center">
          <ImageIcon className="w-8 h-8 mx-auto text-[#6e684a] mb-2" />
          <p className="text-xs text-[#6e684a]">No media yet. Upload a file or add a URL to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {assets.map(a => <MediaCard key={a.id} asset={a} onDelete={() => remove(a.id)} />)}
        </div>
      )}
    </div>
  );
}
