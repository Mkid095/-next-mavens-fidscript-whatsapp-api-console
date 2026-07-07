import { Loader2, Paperclip, Send } from 'lucide-react';

interface ComposerActionsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  canSend: boolean;
  sending: boolean;
  uploading: boolean;
  hasText: boolean;
  hasAttachment: boolean;
  onAttachClick: () => void;
  onSend: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ComposerActions({
  fileInputRef,
  canSend,
  sending,
  uploading,
  hasText,
  hasAttachment,
  onAttachClick,
  onSend,
  onFileChange,
}: ComposerActionsProps) {
  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
        onChange={onFileChange}
        className="hidden"
      />

      {/* Attachment button */}
      <button
        onClick={onAttachClick}
        disabled={!canSend}
        aria-label="Attach file"
        title="Attach image, video, audio, or document"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2d2813] bg-[#1a1915] text-[#6e684a] transition hover:border-[#eab308]/50 hover:text-[#a8a99e] disabled:opacity-50"
      >
        <Paperclip size={16} />
      </button>

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={!canSend || (!hasText && !hasAttachment) || uploading}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eab308] text-black transition hover:bg-[#fde047] disabled:cursor-not-allowed disabled:bg-[#2d2813] disabled:text-[#6e684a]"
      >
        {sending || uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </>
  );
}
