import { X, Library } from 'lucide-react';
import type { MediaAsset, MediaKind } from '../../data/api/platform.js';
import { MediaPicker } from '../media/index.js';

interface MediaSlotProps {
  media: MediaAsset | null;
  kind: 'image' | 'audio';
  onPick: (asset: MediaAsset) => void;
  onClear: () => void;
}

export default function MediaSlot({ media, kind, onPick, onClear }: MediaSlotProps) {
  if (media) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#181711] border border-[#2d2813] rounded-xl">
        {media.kind === 'image' ? (
          <img src={media.url} alt={media.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[#2d2813] flex items-center justify-center text-[#6e684a] text-[10px] font-bold shrink-0">
            {media.kind.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#a8a99e] truncate">{media.name}</p>
          <p className="text-[10px] text-[#6e684a] truncate">{media.url}</p>
        </div>
        <button type="button" onClick={onClear} className="p-1 text-[#6e684a] hover:text-red-400 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return null;
}

interface PickerLauncherProps {
  kind: 'image' | 'audio';
  onPicked: (asset: MediaAsset) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function PickerLauncher({ kind, onPicked, open, setOpen }: PickerLauncherProps) {
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-6 text-xs font-bold bg-[#181711] border-2 border-dashed border-[#2d2813] hover:border-[#eab308] hover:bg-[#181711]/80 rounded-xl text-[#6e684a]">
        <Library className="w-4 h-4" /> Pick from media library
      </button>
      {open && (
        <MediaPicker
          kindFilter={kind as MediaKind}
          onSelect={(a) => { onPicked(a); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
