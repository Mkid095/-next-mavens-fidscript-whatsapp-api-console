import React from 'react';

type MediaType = 'image' | 'video' | 'audio' | 'document';

interface MediaEditorToolbarProps {
  mediaType: MediaType;
  onTypeChange: (t: MediaType) => void;
}

export function MediaEditorToolbar({ mediaType, onTypeChange }: MediaEditorToolbarProps) {
  return (
    <div className="flex gap-2">
      {(['image', 'video', 'audio', 'document'] as MediaType[]).map(t => (
        <button
          key={t}
          onClick={() => onTypeChange(t)}
          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all capitalize ${
            mediaType === t ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-500 border-[#eaebe4]'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
