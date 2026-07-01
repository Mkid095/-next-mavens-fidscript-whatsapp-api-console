import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import { getAuthHeaders } from '../../data/api/client';
import type { Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import type { MirrorMessage } from './messagesApi';

const API_BASE = '';

function mimeToMediaType(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

interface Attachment {
  file: File;
  preview: string; // base64 data URL for images, '' for others
  mediaType: string;
}

// Composer — sends via the existing client-JWT path (token billing intact),
// optimistically appends the outgoing bubble, then the thread hook reconciles
// with the gateway echo on refresh (dedup by id).
interface MessageComposerProps {
  chatJid: string;
  instance: Instance | null;
  onSent: (optimistic: MirrorMessage) => void;
}

export default function MessageComposer({ chatJid, instance, onSent }: MessageComposerProps) {
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

  const canSend = !!instance && instance.status === 'connected' && !sending && !uploading;
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
    // Reset so the same file can be re-selected
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
        // Upload to Cloudinary via our media endpoint
        setUploading(true);
        const { file, preview, mediaType: mt } = attachment;
        mediaType = mt;

        try {
          let uploadRes: Response;
          if (preview) {
            // Image: send as base64 data URL
            uploadRes = await fetch(`${API_BASE}/api/platform/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ image: preview, name: file.name, mime: file.type }),
            });
          } else {
            // Non-image: send as FormData
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

        // Send via Evolution API
        const sendRes = await instancesApi.sendMedia(instance.name, chatJid, mediaUrl, mediaType, text.trim());
        if (!sendRes.success) throw new Error(sendRes.error || 'Failed to send media');
        await doSend(text.trim(), mediaUrl, mediaType);
      } else {
        // Text-only
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

  return (
    <div className="border-t border-[#2d2813] bg-[#181711] px-3 py-2">
      {error && <p className="mb-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400">{error}</p>}

      {/* Attachment preview */}
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
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
            }}
            placeholder={
              !instance || instance.status !== 'connected'
                ? 'Instance is not connected'
                : attachment
                ? 'Add a caption (optional)…'
                : 'Type a message… (Enter to send, Shift+Enter for new line)'
            }
            disabled={!instance || instance.status !== 'connected' || sending}
            rows={1}
            style={{ minHeight: '40px', maxHeight: '144px' }}
            className="w-full resize-none rounded-xl border border-[#2d2813] bg-[#1a1915] px-3 py-2 pr-16 text-sm text-[#a8a99e] placeholder:text-[#5a554a] outline-none transition-colors focus:border-[#eab308]/50 disabled:opacity-50"
          />
          <div className="absolute bottom-2 right-2.5 flex items-center gap-1.5 text-[10px]">
            {charCount > 150 && (
              <span className="font-mono text-[#6e684a]">
                {charCount}{segments > 1 && <span className="ml-1 text-[#5a554a]">({segments} seg)</span>}
              </span>
            )}
            {instance && (
              <span
                title={instance.status}
                className={`h-1.5 w-1.5 rounded-full ${
                  instance.status === 'connected' ? 'bg-green-400'
                    : instance.status === 'connecting' ? 'bg-[#eab308]'
                    : 'bg-[#6e684a]'
                }`}
              />
            )}
          </div>
        </div>

        {/* Attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
          onChange={handleFileChange}
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

        {/* Send button */}
        <button
          onClick={() => void handleSend()}
          disabled={!canSend || (!text.trim() && !attachment) || uploading}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eab308] text-black transition hover:bg-[#fde047] disabled:cursor-not-allowed disabled:bg-[#2d2813] disabled:text-[#6e684a]"
        >
          {sending || uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
