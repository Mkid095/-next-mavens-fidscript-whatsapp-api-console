import { useRef } from 'react';
import { Loader2, Send, Paperclip } from 'lucide-react';
import type { Attachment } from './useComposerSend';

interface ComposerActionsProps {
  canSend: boolean;
  text: string;
  attachment: Attachment | null;
  onFileChange: (file: File) => void;
  onRemoveAttachment: () => void;
  sending: boolean;
  uploading: boolean;
  onSend: () => void;
}

export default function ComposerActions({
  canSend, text, attachment, onFileChange, onRemoveAttachment, sending, uploading, onSend,
}: ComposerActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ''; }}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={!canSend}
        aria-label="Attach file"
        title="Attach image, video, audio, or document"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2d2813] bg-[#1a1915] text-[#6e684a] transition hover:border-[#eab308]/50 hover:text-[#a8a99e] disabled:opacity-50"
      >
        <Paperclip size={16} />
      </button>

      <button
        onClick={onSend}
        disabled={!canSend || (!text.trim() && !attachment) || uploading}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eab308] text-black transition hover:bg-[#fde047] disabled:cursor-not-allowed disabled:bg-[#2d2813] disabled:text-[#6e684a]"
      >
        {sending || uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </>
  );
}
