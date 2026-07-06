import { useCallback, useRef, useState } from 'react';
import { getAuthHeaders } from '../../../data/api/client';
import { instancesApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import type { MirrorMessage } from '../messagesApi';

const API_BASE = '';

function mimeToMediaType(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

function makeOptimistic(content: string, mediaUrl: string | null, mediaType: string | null): MirrorMessage {
  return {
    id: `optimistic:${Date.now()}`,
    direction: 'outgoing',
    type: (mediaType || 'text') as MirrorMessage['type'],
    content: content || (mediaType === 'audio' ? 'Audio' : mediaType === 'image' ? 'Image' : mediaType === 'video' ? 'Video' : 'File'),
    mediaUrl, mediaMimetype: null, senderName: null, senderJid: null, timestamp: Date.now(),
  };
}

async function uploadMedia(file: File, preview: string): Promise<{ url: string; mediaType: string }> {
  const headers = getAuthHeaders();
  let uploadRes: Response;
  if (preview) {
    uploadRes = await fetch(`${API_BASE}/api/platform/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ image: preview, name: file.name, mime: file.type }),
    });
  } else {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name);
    fd.append('mime', file.type);
    uploadRes = await fetch(`${API_BASE}/api/platform/media`, { method: 'POST', headers, body: fd });
  }
  const data = await uploadRes.json() as { success: boolean; data?: { url: string }; error?: string };
  if (!data.success || !data.data?.url) throw new Error(data.error || 'Upload failed');
  return { url: data.data.url, mediaType: mimeToMediaType(file.type) };
}

export interface Attachment { file: File; preview: string; mediaType: string; }

export function useComposerSend(instance: Instance | null, chatJid: string, onSent: (m: MirrorMessage) => void) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const inFlight = useRef(false);

  const canSend = !!instance && instance.status === 'connected' && !sending && !uploading;
  const charCount = text.length;
  const segments = charCount > 1600 ? 3 : charCount > 160 ? 2 : 1;

  const removeAttachment = useCallback(() => setAttachment(null), []);

  const handleSend = useCallback(async () => {
    if (!instance) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError(null);
    try {
      if (attachment) {
        setUploading(true);
        try {
          const { url, mediaType } = await uploadMedia(attachment.file, attachment.preview);
          const res = await instancesApi.sendMedia(instance.name, chatJid, url, mediaType, text.trim());
          if (!res.success) throw new Error(res.error || 'Failed to send media');
          onSent(makeOptimistic(text.trim(), url, mediaType));
        } finally { setUploading(false); }
      } else {
        if (!text.trim()) { inFlight.current = false; setSending(false); return; }
        const res = await instancesApi.sendText(instance.name, chatJid, text.trim());
        if (!res.success) throw new Error(res.error || 'Failed to send text');
        onSent(makeOptimistic(text.trim(), null, null));
      }
      setText('');
      setAttachment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
      inFlight.current = false;
    }
  }, [instance, chatJid, text, attachment, onSent]);

  const handleFileChange = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachment({ file, preview: ev.target?.result as string, mediaType: mimeToMediaType(file.type) });
      reader.readAsDataURL(file);
    } else {
      setAttachment({ file, preview: '', mediaType: mimeToMediaType(file.type) });
    }
  }, []);

  return {
    text, setText,
    sending, uploading, error, attachment,
    canSend, charCount, segments,
    removeAttachment, handleSend, handleFileChange,
  };
}
