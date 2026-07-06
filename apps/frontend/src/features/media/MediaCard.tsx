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
      className={`group relative bg-[#1a1915] border rounded-xl overflow-hidden transition-shadow ${selected ? 'border-[#eab308] ring-2 ring-[#eab308]/50' : 'border-[#2d2813] hover:border-[#3d3a1e]'} ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="aspect-square bg-[#181711] flex items-center justify-center overflow-hidden">
        {asset.kind === 'image' ? (
          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#6e684a]">
            <ImageIcon className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase">{asset.kind}</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-medium text-[#a8a99e] truncate">{asset.name}</p>
        {asset.tags.length > 0 && (
          <p className="text-[9px] text-[#6e684a] truncate">{asset.tags.slice(0, 3).join(' · ')}</p>
        )}
      </div>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1.5 right-1.5 p-1.5 bg-[#1a1915]/90 backdrop-blur rounded-lg text-[#6e684a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
