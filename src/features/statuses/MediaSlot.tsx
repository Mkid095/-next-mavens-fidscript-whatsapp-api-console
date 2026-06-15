import { X, Library } from 'lucide-react';
import type { MediaAsset, MediaKind } from '../../data/api/platform.js';
import { MediaPicker } from '../media/index.js';

interface MediaSlotProps {
  media: MediaAsset | null;
  kind: 'image' | 'audio';
  onPick: (asset: MediaAsset) => void;
  onClear: () => void;
}

/**
 * StatusComposer sub-component — shows the picked media (with preview +
 * remove button) or an empty "pick from library" affordance. Toggles the
 * MediaPicker modal when empty + clicked.
 */
export default function MediaSlot({ media, kind, onPick, onClear }: MediaSlotProps) {
  if (media) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl">
        {media.kind === 'image' ? (
          <img src={media.url} alt={media.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 text-[10px] font-bold shrink-0">
            {media.kind.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-forest-deep truncate">{media.name}</p>
          <p className="text-[10px] text-stone-500 truncate">{media.url}</p>
        </div>
        <button type="button" onClick={onClear} className="p-1 text-stone-400 hover:text-red-600 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  // Empty state — needs its own picker state since pickerOpen lives in the parent.
  return null;
}

interface PickerLauncherProps {
  kind: 'image' | 'audio';
  onPicked: (asset: MediaAsset) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

/** Open-state launcher + modal. Co-located because the composer needs both. */
export function PickerLauncher({ kind, onPicked, open, setOpen }: PickerLauncherProps) {
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-6 text-xs font-bold bg-[#f9f9f2] border-2 border-dashed border-[#eaebe4] hover:border-yellow-500 hover:bg-yellow-50 rounded-xl text-stone-600">
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
