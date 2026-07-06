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
          <svg width="16" height="16" className="text-[#6e684a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[#a8a99e]">{attachment.file.name}</p>
        <p className="text-[10px] text-[#6e684a]">{(attachment.file.size / 1024).toFixed(1)} KB · {attachment.mediaType}</p>
      </div>
      <button onClick={onRemove} className="text-[#6e684a] hover:text-[#a8a99e]">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}
