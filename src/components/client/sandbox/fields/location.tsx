import { useState } from 'react';
import { MapPin } from 'lucide-react';
import LocationPickerModal from '../LocationPickerModal.js';

export function LocationField({
  fieldKey, bodyValues, onBodyValuesChange, placeholder,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={bodyValues[fieldKey] || ''}
          onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
        />
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl shrink-0">
          <MapPin className="w-3.5 h-3.5" /> Pick on Map
        </button>
      </div>
      <p className="text-[9px] text-stone-400">Format: latitude,longitude e.g. -1.286389,36.817223</p>
      <LocationPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onApply={(lat, lng) => onBodyValuesChange({ ...bodyValues, latitude: lat, longitude: lng })}
      />
    </div>
  );
}
