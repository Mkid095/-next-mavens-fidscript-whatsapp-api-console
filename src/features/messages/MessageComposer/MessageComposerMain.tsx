import { useCallback, useEffect, useRef, useState } from 'react';
import type { Instance } from '../../../services/api';
import type { MirrorMessage } from '../messagesApi';
import ComposerInput from './ComposerInput';
import ComposerActions from './ComposerActions';
import AttachmentPreview from './AttachmentPreview';
import LockedBanner from './LockedBanner';
import { useAttachmentUpload } from './useAttachmentUpload';

interface MessageComposerProps {
  chatJid: string;
  instance: Instance | null;
  onSent: (optimistic: MirrorMessage) => void;
  locked?: boolean;
}

export default function MessageComposer({ chatJid, instance, onSent, locked }: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !!instance && instance.status === 'connected' && !locked;

  const {
    text, setText,
    sending, uploading, error,
    attachment,
    fileInputRef,
    handleFileChange,
    removeAttachment,
    handleSend,
  } = useAttachmentUpload({
    instanceName: instance?.name ?? '',
    chatJid,
    onSent,
    onError: () => { /* handled internally */ },
  });

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`;
  }, []);

  useEffect(() => { adjustHeight(); }, [text, adjustHeight]);

  const charCount = text.length;
  const segments = charCount > 1600 ? 3 : charCount > 160 ? 2 : 1;

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  return (
    <div className="border-t border-[#2d2813] bg-[#181711] px-3 py-2">
      {error && (
        <p className="mb-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400">
          {error}
        </p>
      )}

      {locked && <LockedBanner />}

      {attachment && <AttachmentPreview attachment={attachment} onRemove={removeAttachment} />}

      <div className="flex items-end gap-2">
        <ComposerInput
          text={text}
          instance={instance}
          locked={!!locked}
          sending={sending}
          attachment={attachment}
          charCount={charCount}
          segments={segments}
          textareaRef={textareaRef}
          onChange={setText}
          onHeightAdjust={adjustHeight}
          onKeyDown={onKeyDown}
        />

        <ComposerActions
          fileInputRef={fileInputRef}
          canSend={canSend && !sending && !uploading}
          sending={sending}
          uploading={uploading}
          hasText={!!text.trim()}
          hasAttachment={!!attachment}
          onAttachClick={handleAttachClick}
          onSend={() => void handleSend()}
          onFileChange={handleFileChange}
        />
      </div>
    </div>
  );
}
