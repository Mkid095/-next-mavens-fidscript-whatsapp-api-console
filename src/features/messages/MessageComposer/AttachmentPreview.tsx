import { Paperclip, X } from 'lucide-react';

interface Attachment {
  file: File;
  preview: string;
  mediaType: string;
}

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove: () => void;
}

export default function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#1a1915] border border-[#2d2813] p-2">
      {attachment.preview ? (
        <img src={attachment.preview} alt="Attachment preview" className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2d2813]">
          <Paperclip size={16} className="text-[#6e684a]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[#a8a99e]">{attachment.file.name}</p>
        <p className="text-[10px] text-[#6e684a]">{(attachment.file.size / 1024).toFixed(1)} KB · {attachment.mediaType}</p>
      </div>
      <button onClick={onRemove} className="text-[#6e684a] hover:text-[#a8a99e]">
        <X size={14} />
      </button>
    </div>
  );
}
