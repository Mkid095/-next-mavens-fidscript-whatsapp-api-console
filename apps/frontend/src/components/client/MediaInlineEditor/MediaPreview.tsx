import React from 'react';
import { Paperclip } from 'lucide-react';

interface MediaPreviewProps {
  preview: string;
  file: File | null;
  onPick: () => void;
  onClear: () => void;
}

export function MediaPreview({ preview, file, onPick, onClear }: MediaPreviewProps) {
  if (!file) {
    return (
      <button
        onClick={onPick}
        className="w-10 h-10 rounded-2xl bg-forest-deep text-white flex items-center justify-center hover:bg-[#33301a] transition-all shrink-0"
      >
        <Paperclip className="w-4 h-4" />
      </button>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
      {preview ? (
        <img src={preview} alt="preview" className="w-full h-full object-cover" />
      ) : (
        <Paperclip className="w-4 h-4 text-stone-500" />
      )}
    </div>
  );
}
