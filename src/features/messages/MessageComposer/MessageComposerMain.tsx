import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Paperclip, Send, ShieldOff, X } from 'lucide-react';
import { getAuthHeaders } from '../../../data/api/client';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import type { MirrorMessage } from '../messagesApi';
import ComposerInput from './ComposerInput';
import ComposerActions from './ComposerActions';

const API_BASE = '';

function mimeToMediaType(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

interface Attachment {
  file: File;
  preview: string;
  mediaType: string;
}

interface MessageComposerProps {
  chatJid: string;
  instance: Instance | null;
  onSent: (optimistic: MirrorMessage) => void;
  locked?: boolean;
}

export default function MessageComposer({ chatJid, instance, onSent, locked }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`;
  }, []);

  useEffect(() => { adjustHeight(); }, [text, adjustHeight]);

  const canSend = !!instance && instance.status === 'connected' && !sending && !uploading && !locked;
  const charCount = text.length;
  const segments = charCount > 1600 ? 3 : charCount > 160 ? 2 : 1;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment({ file, preview: ev.target?.result as string, mediaType: mimeToMediaType(file.type) });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment({ file, preview: '', mediaType: mimeToMediaType(file.type) });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const doSend = async (content: string, mediaUrl: string | null, mediaType: string | null) => {
    const optimistic: MirrorMessage = {
      id: `optimistic:${Date.now()}`,
      direction: 'outgoing',
      type: mediaType as MirrorMessage['type'] || 'text',
      content: content || (mediaType === 'audio' ? 'Audio' : mediaType === 'image' ? 'Image' : mediaType === 'video' ? 'Video' : 'File'),
      mediaUrl: mediaUrl,
      mediaMimetype: null,
      senderName: null,
      senderJid: null,
      timestamp: Date.now(),
    };
    onSent(optimistic);
  };

  const handleSend = async () => {
    if (!instance) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (attachment) {
        setUploading(true);
        const { file, preview, mediaType: mt } = attachment;
        mediaType = mt;

        try {
          let uploadRes: Response;
          if (preview) {
            uploadRes = await fetch(`${API_BASE}/api/platform/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ image: preview, name: file.name, mime: file.type }),
            });
          } else {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('name', file.name);
            fd.append('mime', file.type);
            uploadRes = await fetch(`${API_BASE}/api/platform/media`, {
              method: 'POST',
              headers: getAuthHeaders() as Record<string, string>,
              body: fd,
            });
          }

          const uploadData = await uploadRes.json() as { success: boolean; data?: { url: string }; error?: string };
          if (!uploadData.success || !uploadData.data?.url) {
            throw new Error(uploadData.error || 'Upload failed');
          }
          mediaUrl = uploadData.data.url;
        } finally {
          setUploading(false);
        }

        const sendRes = await instancesApi.sendMedia(instance.name, chatJid, mediaUrl, mediaType, text.trim());
        if (!sendRes.success) throw new Error(sendRes.error || 'Failed to send media');
        await doSend(text.trim(), mediaUrl, mediaType);
      } else {
        if (!text.trim()) { inFlight.current = false; setSending(false); return; }
        await doSend(text.trim(), null, null);
        const res = await instancesApi.sendText(instance.name, chatJid, text.trim());
        if (!res.success) throw new Error(res.error || 'Failed to send text');
      }

      setText('');
      setAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
      inFlight.current = false;
    }
  };

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="border-t border-[#2d2813] bg-[#181711] px-3 py-2">
      {error && <p className="mb-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400">{error}</p>}

      {locked && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#2d2813] bg-[#1a1915] px-3 py-2 text-xs text-[#6e684a]">
          <ShieldOff size={14} className="shrink-0 text-[#eab308]" />
          Only admins can send messages in this group
        </div>
      )}

      {attachment && (
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
          <button onClick={removeAttachment} className="text-[#6e684a] hover:text-[#a8a99e]">
            <X size={14} />
          </button>
        </div>
      )}

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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
          }}
        />

        <ComposerActions
          fileInputRef={fileInputRef}
          canSend={canSend}
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
