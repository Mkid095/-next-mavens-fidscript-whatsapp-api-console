import { useCallback, useRef, useState } from 'react';
import { getAuthHeaders } from '../../../data/api/client';
import { instancesApi } from '../../../services/api';
import type { MirrorMessage } from '../messagesApi';

const API_BASE = '';

interface Attachment {
  file: File;
  preview: string;
  mediaType: string;
}

interface UseAttachmentUploadOptions {
  instanceName: string;
  chatJid: string;
  /** Called with the optimistic message after a successful send */
  onSent: (msg: MirrorMessage) => void;
  /** Called on send failure */
  onError: (msg: string) => void;
}

export function useAttachmentUpload({ instanceName, chatJid, onSent, onError }: UseAttachmentUploadOptions) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  const makeOptimistic = useCallback((content: string, mediaUrl: string | null, mediaType: string | null): MirrorMessage => ({
    id: `optimistic:${crypto.randomUUID()}`,
    direction: 'outgoing',
    type: mediaType as MirrorMessage['type'] || 'text',
    content: content || (mediaType === 'audio' ? 'Audio' : mediaType === 'image' ? 'Image' : mediaType === 'video' ? 'Video' : 'File'),
    mediaUrl: mediaUrl,
    mediaMimetype: null,
    senderName: null,
    senderJid: null,
    timestamp: Date.now(),
  }), []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const mediaType = isImage ? 'image' : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio' : 'document';
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment({ file, preview: ev.target?.result as string, mediaType });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment({ file, preview: '', mediaType });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const mimeToMediaType = (mime: string): string => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleSend = async () => {
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

        const sendRes = await instancesApi.sendMedia(instanceName, chatJid, mediaUrl, mediaType, text.trim());
        if (!sendRes.success) throw new Error(sendRes.error || 'Failed to send media');
        onSent(makeOptimistic(text.trim(), mediaUrl, mediaType));
        // Only clear on success — keep text/attachment so the user can retry on failure.
        setText('');
        setAttachment(null);
      } else {
        if (!text.trim()) { inFlight.current = false; setSending(false); return; }
        const res = await instancesApi.sendText(instanceName, chatJid, text.trim());
        if (!res.success) throw new Error(res.error || 'Failed to send text');
        onSent(makeOptimistic(text.trim(), null, null));
        setText('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
      inFlight.current = false;
    }
  };

  return {
    text, setText,
    sending, uploading, error,
    attachment,
    fileInputRef,
    handleFileChange,
    removeAttachment,
    handleSend,
    makeOptimistic,
  };
}
