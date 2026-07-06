import { useCallback, useEffect, useRef } from 'react';
import type { Instance } from '../../../services/api';
import type { MirrorMessage } from '../messagesApi';
import ComposerInput from './ComposerInput';
import ComposerActions from './ComposerActions';
import RestrictedBanner from './RestrictedBanner';
import AttachmentPreview from './AttachmentPreview';
import { useComposerSend, type Attachment } from './useComposerSend';

interface MessageComposerProps {
  chatJid: string;
  instance: Instance | null;
  onSent: (optimistic: MirrorMessage) => void;
  locked?: boolean;
}

export default function MessageComposer({ chatJid, instance, onSent, locked }: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    text, setText,
    sending, uploading, error, attachment,
    canSend, charCount, segments,
    removeAttachment, handleSend, handleFileChange,
  } = useComposerSend(instance, chatJid, onSent);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`;
  }, []);

  useEffect(() => { adjustHeight(); }, [text, adjustHeight]);

  return (
    <div className="border-t border-[#2d2813] bg-[#181711] px-3 py-2">
      {error && <p className="mb-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400">{error}</p>}
      {locked && <RestrictedBanner />}
      {attachment && <AttachmentPreview attachment={attachment} onRemove={removeAttachment} />}
      <div className="flex items-end gap-2">
        <ComposerInput
          text={text}
          onChange={(v) => { setText(v); adjustHeight(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
          placeholder={
            locked ? 'Only admins can send in this group'
              : !instance || instance.status !== 'connected' ? 'Instance is not connected'
              : attachment ? 'Add a caption (optional)…'
              : 'Type a message… (Enter to send, Shift+Enter for new line)'
          }
          disabled={!instance || instance.status !== 'connected' || sending || locked}
          textareaRef={textareaRef}
          charCount={charCount}
          segments={segments}
          instance={instance}
        />
        <ComposerActions
          canSend={canSend && !locked}
          text={text}
          attachment={attachment}
          onFileChange={handleFileChange}
          onRemoveAttachment={removeAttachment}
          sending={sending}
          uploading={uploading}
          onSend={() => void handleSend()}
        />
      </div>
    </div>
  );
}
