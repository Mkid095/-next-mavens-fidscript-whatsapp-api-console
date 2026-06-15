import { Image as ImageIcon, Trash2 } from 'lucide-react';
import type { MediaAsset } from '../../data/api/platform.js';

interface MediaCardProps {
  asset: MediaAsset;
  onDelete?: () => void;
  onClick?: () => void;
  selected?: boolean;
}

/**
 * Single media asset tile. Click selects (MediaPicker), hover exposes delete
 * (MediaLibrary). For non-image kinds we show a kind-chip placeholder so the
 * grid stays uniform.
 */
export default function MediaCard({ asset, onDelete, onClick, selected }: MediaCardProps) {
  return (
    <div onClick={onClick}
      className={`group relative bg-white border rounded-xl overflow-hidden transition-shadow ${selected ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-[#eaebe4] hover:shadow-md'} ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="aspect-square bg-stone-50 flex items-center justify-center overflow-hidden">
        {asset.kind === 'image' ? (
          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-stone-400">
            <ImageIcon className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase">{asset.kind}</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-medium text-stone-700 truncate">{asset.name}</p>
        {asset.tags.length > 0 && (
          <p className="text-[9px] text-stone-400 truncate">{asset.tags.slice(0, 3).join(' · ')}</p>
        )}
      </div>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur rounded-lg text-stone-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
